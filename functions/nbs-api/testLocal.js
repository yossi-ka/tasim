const { getNbsToken, getNbsOrders, getNbsCustomers } = require('./services');
const XLSX = require('xlsx');

/**
 * Generic function to parse Excel file response and convert to JSON
 * @param {ArrayBuffer} excelResponse - The Excel file response from API
 * @param {Object} headerMapping - Object mapping Hebrew headers to English field names
 * @param {Function} rowProcessor - Callback function to process each row (optional)
 * @returns {Array} Array of processed JSON objects
 */
const parseExcelToJson = (excelResponse, headerMapping, rowProcessor = null) => {
    try {
        console.log('📊 Starting Excel parsing...');//לוג ראשון 20:58

        // Parse the Excel file using xlsx - optimize for large files
        let workbook;
        if (excelResponse instanceof ArrayBuffer) {
            // If it's already an ArrayBuffer, use it directly
            workbook = XLSX.read(excelResponse, { type: 'array' });
        } else if (Buffer.isBuffer(excelResponse)) {
            // If it's a Buffer, use it directly without conversion
            workbook = XLSX.read(excelResponse, { type: 'buffer' });
        } else {
            // Fallback to original method
            workbook = XLSX.read(new Uint8Array(excelResponse), { type: 'array' });
        }

        // Get the first sheet name
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];

        console.log('📋 Excel workbook parsed, processing sheet...');//לוג שני21:06 

        // Convert to JSON with headers - optimize for large datasets
        const jsonData = XLSX.utils.sheet_to_json(worksheet, {
            header: 1,
            defval: '', // Default value for empty cells
            raw: false // Parse values instead of keeping them raw
        });

        if (jsonData.length === 0) {
            console.log('⚠️ No data found in Excel file');
            return [];
        }

        // First row contains headers
        const headers = jsonData[0];
        console.log('📋 Headers found:', headers);

        // Convert data rows to structured objects with progress tracking
        console.log(`🔄 Processing ${jsonData.length - 1} data rows...`);
        const structuredData = [];

        for (let i = 1; i < jsonData.length; i++) {
            const row = jsonData[i];
            const rowData = {};

            // Map headers to field names
            for (let headerIndex = 0; headerIndex < headers.length; headerIndex++) {
                const header = headers[headerIndex];
                const fieldName = headerMapping[header];
                if (fieldName && row[headerIndex] !== undefined && row[headerIndex] !== '') {
                    rowData[fieldName] = row[headerIndex];
                }
            }

            // Apply row processor if provided
            let processedRow;
            if (rowProcessor && typeof rowProcessor === 'function') {
                processedRow = rowProcessor(rowData, row, i - 1);
            } else {
                processedRow = rowData;
            }

            // Add to results if not empty
            if (processedRow && Object.keys(processedRow).length > 0) {
                structuredData.push(processedRow);
            }

            // Progress logging every 5000 rows
            if (i % 500 === 0) {
                console.log(`📊 Processed ${i - 1}/${jsonData.length - 1} rows`);
            }
        }

        console.log(`✅ Excel parsing completed. Total rows processed: ${structuredData.length}`);
        return structuredData;

    } catch (error) {
        console.error('💥 Error parsing Excel file:', error.message);
        throw new Error(`Excel parsing failed: ${error.message}`);
    }
};

const getOrders = async (token) => {
    try {
        // Create filters object for API request
        const filtersObject = {
            searchTerm: "",
            saleIds: [],
            branchIds: [],
            paymentMethod: [],
            status: ["paid"],
            createdVia: [],
            shippingMethod: [],
            sumRange: {
                from: 0,
                to: 0
            },
            updatedRange: {
                unit: "days",
                amount: 1
            }
        };

        // Convert to URL-encoded string for API
        const filters = encodeURIComponent(JSON.stringify(filtersObject));
        // const exportType = "basic"; //detailed | basic

        if (!token) {
            token = await getNbsToken();
        }

        let mainOrders;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
            try {
                mainOrders = await getNbsOrders(token, filters, "basic");
                break; // Success, exit retry loop
            } catch (error) {
                retryCount++;
                console.log(`⚠️ API call failed (attempt ${retryCount}/${maxRetries}):`, error.message);

                if (retryCount >= maxRetries) {
                    throw error; // Max retries reached, throw error
                }

                // Wait before retry, with exponential backoff
                const waitTime = retryCount * 2000; // 2s, 4s, 6s
                console.log(`⏳ Waiting ${waitTime}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));

                // Get new token on retry
                token = await getNbsToken();
            }
        }

        // Map Hebrew headers to English field names
        const headerMapping = {
            "מספר הזמנה": "nbsOrderId",
            "שם פרטי": "firstName",
            "שם משפחה": "lastName",
            "ת.ז": "idNumber",
            "טלפון": "phones",
            "אמייל": "email",
            "עיר": "city",
            "כתובת": "street",
            "תאריך ביצוע": "openedAt",
            "תאריך עדכון": "closedAt",
            "סטטוס": "nbsOrderStatus",
            "אופן תשלום": "paymentMethod",
            "סה\"כ": "totalPrice",
            "הערה": "orderNote",
            "מידע נוסף": "moreInfo"
        };

        // Row processor function for orders
        const orderRowProcessor = (orderData) => {
            // Skip rows without order ID
            if (!orderData.nbsOrderId) {
                return null;
            }

            // Special handling for phones - split by space into array
            if (orderData.phones && typeof orderData.phones === 'string') {
                orderData.phones = orderData.phones.split(' ').filter(phone => phone.trim() !== '');
            }

            // Handle dates
            ['openedAt', 'closedAt'].forEach(dateField => {
                if (orderData[dateField]) {
                    if (typeof orderData[dateField] === 'number') {
                        // Excel serial date
                        orderData[dateField] = new Date((orderData[dateField] - 25569) * 86400 * 1000);
                    } else if (typeof orderData[dateField] === 'string') {
                        orderData[dateField] = new Date(orderData[dateField]);
                    }
                }
            });

            // Handle numbers
            ['totalPrice', 'nbsOrderId'].forEach(numberField => {
                if (orderData[numberField] && !isNaN(orderData[numberField])) {
                    orderData[numberField] = Number(orderData[numberField]);
                }
            });

            return orderData;
        };

        // Use the generic Excel parser
        const structuredData = parseExcelToJson(mainOrders, headerMapping, orderRowProcessor);

        console.log('Parsed Orders Data:');
        // console.log(JSON.stringify(structuredData, null, 2));
        console.log(`Total orders parsed: ${structuredData.length}`);

        return structuredData;

    } catch (error) {
        console.error('💥 Error during order upload:', error.message);
        throw error;
    }
}

const getOrderProducts = async (token, specificOrderIds = null) => {
    try {
        // Create filters object for API request
        const filtersObject = {
            searchTerm: "",
            saleIds: [], // Filter by specific order IDs if provided
            branchIds: [],
            paymentMethod: [],
            status: ["paid"],
            createdVia: [],
            shippingMethod: [],
            sumRange: {
                from: 0,
                to: 0
            },
            updatedRange: {
                unit: "days",
                amount: 1
            }
        };

        // Convert to URL-encoded string for API
        const filters = encodeURIComponent(JSON.stringify(filtersObject));

        if (!token) {
            token = await getNbsToken();
        }

        let mainOrders;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
            try {
                mainOrders = await getNbsOrders(token, filters, "weights");
                break; // Success, exit retry loop
            } catch (error) {
                retryCount++;
                console.log(`⚠️ API call failed (attempt ${retryCount}/${maxRetries}):`, error.message);

                if (retryCount >= maxRetries) {
                    throw error; // Max retries reached, throw error
                }

                // Wait before retry, with exponential backoff
                const waitTime = retryCount * 2000; // 2s, 4s, 6s
                console.log(`⏳ Waiting ${waitTime}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));

                // Get new token on retry
                token = await getNbsToken();
            }
        }

        // Map Hebrew headers to English field names - only required columns
        const headerMapping = {
            "מספר הזמנה": "nbsOrderId",
            "פריט": "productName",
            "משקל פריט": "weights",
            "מחיר פריט": "price"
        };


        // Row processor function for order products
        const orderProductRowProcessor = (orderData) => {
            // Skip rows without order ID or product name
            if (!orderData.nbsOrderId || !orderData.productName) {
                return null;
            }

            // Handle numbers
            ['nbsOrderId', 'weights', 'price'].forEach(numberField => {
                if (orderData[numberField] && !isNaN(orderData[numberField])) {
                    orderData[numberField] = Number(orderData[numberField]);
                }
            });

            return orderData;
        };

        // Use the generic Excel parser
        const parsedData = parseExcelToJson(mainOrders, headerMapping, orderProductRowProcessor);

        console.log('212-specificOrderIds', JSON.stringify(specificOrderIds, null, 2),
            `Parsed Order Products Data: ${parsedData.length} items`);
        // If specific order IDs were provided, filter the results
        let filteredData = parsedData;
        if (specificOrderIds && specificOrderIds.length > 0) {
            const orderIdSet = new Set(specificOrderIds);
            filteredData = parsedData.filter(item => orderIdSet.has(item.nbsOrderId));
            console.log(`🔍 Filtered products from ${parsedData.length} to ${filteredData.length} based on order IDs`);
        }
        console.log('220-filteredData', filteredData.length, 'items');


        // Normalize data - group by order and product, sum quantities/weights (optimized)
        console.log('🔄 Starting data normalization...');
        const productGroups = new Map();

        console.log('227');

        for (let i = 0; i < filteredData.length; i++) {
            const row = filteredData[i];
            const key = `${row.nbsOrderId}-${row.productName}`;

            if (productGroups.has(key)) {
                const existing = productGroups.get(key);
                // Sum weights if exists, otherwise increment quantity
                if (row.weights && existing.weights !== undefined) {
                    existing.weights += row.weights;
                    existing.quantityOrWeight = existing.weights;
                } else if (!row.weights && existing.quantity !== undefined) {
                    existing.quantity += 1;
                    existing.quantityOrWeight = existing.quantity;
                } else if (row.weights && existing.quantity !== undefined) {
                    // Convert quantity to weight-based
                    delete existing.quantity;
                    existing.weights = row.weights;
                    existing.quantityOrWeight = row.weights;
                } else if (!row.weights && existing.weights !== undefined) {
                    // Keep existing weight, don't add quantity
                    existing.quantityOrWeight = existing.weights;
                }
            } else {
                const newProduct = { ...row };
                if (row.weights) {
                    newProduct.quantityOrWeight = row.weights;
                } else {
                    newProduct.quantity = 1;
                    newProduct.quantityOrWeight = 1;
                }
                productGroups.set(key, newProduct);
            }

            // Progress logging every 5000 items
            if (i % 5000 === 0) {
                console.log(`📊 Normalized ${i}/${filteredData.length} products`);
            }
        }

        console.log('269');


        // Convert map to array and clean up
        const normalizedData = [];
        productGroups.forEach(product => {
            delete product.quantity; // Clean up temporary fields
            normalizedData.push(product);
        });

        console.log('✅ Data normalization completed', normalizedData.length, normalizedData.length != 0 ? normalizedData[0] : 'No data');

        console.log('Parsed and Normalized Order Products Data:');
        // console.log(JSON.stringify(normalizedData, null, 2));
        console.log(`Total normalized products: ${normalizedData.length}`);

        console.log('284');

        return normalizedData;

    } catch (error) {
        console.error('💥 Error during order products processing:', error.message);
        throw error;
    }
}

const test = async () => {
    try {
        const token = await getNbsToken();
        console.log('Token:', token);

        // Get orders
        const orders = await getOrders(token);
        console.log('Orders:', orders.length, 'items');

        // Get order products
        const orderProducts = await getOrderProducts(token, orders.map(o => o.nbsOrderId));
        console.log('Order Products:', orderProducts.length, 'items');

    } catch (error) {
        console.error('Error in test function:', error.message);
    }
}

test()
    .then(() => console.log('Test completed successfully'))
    .catch(error => console.error('Test failed:', error.message));
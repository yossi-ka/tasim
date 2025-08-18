/**
 * NBS Orders and Products Fetcher & Normalizer
 * 
 * This script fetches orders and products from the NBS API, normalizes the data
 * so each order contains an array of its associated products, and writes the
 * result to a JSON file (orders_with_products.json).
 * 
 * Usage:
 * - Run directly: node fetchAndNormalizeOrders.js
 * - Import as module: const { fetchAndNormalizeOrders } = require('./fetchAndNormalizeOrders.js')
 * 
 * Output:
 * - Creates orders_with_products.json in the same directory
 * - Prints summary statistics to console
 */

const axios = require('axios');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');

const BASE_NBS_URL = "https://sales-v2.nbs-app.net/api/crm/";

const SALE_IDS = [8539]

// פונקציה לקבלת טוקן מ-NBS
const getNbsToken = async () => {
    console.log('🔐 Starting authentication process...');

    const userName = "naftali";
    const password = "naftali2015";

    if (!userName || !password) {
        console.error('❌ NBS credentials are missing');
        throw new Error('NBS credentials are not set');
    }

    const data = JSON.stringify({
        "email": userName,
        "username": userName,
        "password": password
    });

    const config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: BASE_NBS_URL + 'auth/login/',
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Origin': 'https://crm.shoppi.co.il',
            'Referer': 'https://crm.shoppi.co.il/',
            'Sec-Fetch-Site': 'cross-site',
            'Sec-Fetch-Mode': 'cors',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
            'Content-Type': 'application/json'
        },
        data: data
    };

    try {
        const res = await axios.request(config);

        if (res.status !== 200 || res.data.status !== 'success') {
            console.error('❌ Authentication failed:', res.status, res.statusText);
            throw new Error(`Failed to get token: ${res.status} ${res.statusText}`);
        }

        console.log('🎉 Authentication successful! Token received.');
        return res.data.data.access;

    } catch (error) {
        console.error('💥 Error during authentication:', error.message);
        if (error.response) {
            console.error('📥 Error response status:', error.response.status);
            console.error('📥 Error response data:', error.response.data);
        }
        throw error;
    }
};

// פונקציה לשליפת נתונים מ-NBS
const getNbsOrders = async (token, filters, exportType) => {
    console.log(`📦 Fetching orders with exportType: ${exportType}`);

    const config = {
        method: 'get',
        maxBodyLength: Infinity,
        url: `${BASE_NBS_URL}order/report/export-xlsx/?filters=${filters}&sort=%7B%22sortBy%22:%22%22,%22sortDir%22:%22desc%22%7D&exportType=${exportType}`,
        headers: {
            'Accept': 'application/json, text/plain, */*',
            'Origin': 'https://crm.shoppi.co.il',
            'Referer': 'https://crm.shoppi.co.il/',
            'Sec-Fetch-Site': 'cross-site',
            'Sec-Fetch-Mode': 'cors',
            'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
            'Authorization': 'Bearer ' + token
        },
        responseType: 'arraybuffer'
    };

    try {
        const res = await axios.request(config);

        if (res.status !== 200) {
            console.error('❌ Failed to fetch orders:', res.status, res.statusText);
            throw new Error(`Failed to get orders: ${res.status} ${res.statusText}`);
        }

        console.log('✅ Orders data received successfully');
        return res.data;

    } catch (error) {
        console.error('💥 Error fetching orders:', error.message);
        if (error.response) {
            console.error('📥 Error response status:', error.response.status);
            console.error('📥 Error response headers:', error.response.headers);
        }
        throw error;
    }
};

// פונקציה לפרסור Excel לJSON
const parseExcelToJson = (excelResponse, headerMapping, rowProcessor = null) => {
    console.log('📊 Starting Excel parsing...');

    let workbook;
    if (excelResponse instanceof ArrayBuffer) {
        workbook = XLSX.read(excelResponse, { type: 'array' });
    } else if (excelResponse instanceof Uint8Array) {
        workbook = XLSX.read(excelResponse, { type: 'array' });
    } else {
        workbook = XLSX.read(new Uint8Array(excelResponse), { type: 'array' });
    }

    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    console.log('📋 Excel workbook parsed, processing sheet...');

    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
        header: 1,
        defval: '',
        raw: false
    });

    if (jsonData.length === 0) {
        console.log('⚠️ No data found in Excel file');
        return [];
    }

    const headers = jsonData[0];
    console.log('📋 Headers found:', headers);

    console.log(`🔄 Processing ${jsonData.length - 1} data rows...`);
    const structuredData = [];

    for (let i = 1; i < jsonData.length; i++) {
        const row = jsonData[i];
        const rowData = {};

        for (let headerIndex = 0; headerIndex < headers.length; headerIndex++) {
            const header = headers[headerIndex];
            const fieldName = headerMapping[header];
            if (fieldName && row[headerIndex] !== undefined && row[headerIndex] !== '') {
                rowData[fieldName] = row[headerIndex];
            }
        }

        let processedRow;
        if (rowProcessor && typeof rowProcessor === 'function') {
            processedRow = rowProcessor(rowData, row, i - 1);
        } else {
            processedRow = rowData;
        }

        if (processedRow && Object.keys(processedRow).length > 0) {
            structuredData.push(processedRow);
        }

        if (i % 500 === 0) {
            console.log(`📊 Processed ${i - 1}/${jsonData.length - 1} rows`);
        }
    }

    console.log(`✅ Excel parsing completed. Total rows processed: ${structuredData.length}`);
    return structuredData;
};

// פונקציה לשליפת הזמנות
const getOrders = async (token, amountDaysToImport = 1) => {
    try {
        const filtersObject = {
            searchTerm: "",
            saleIds: SALE_IDS,
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
                amount: amountDaysToImport
            }
        };

        const filters = encodeURIComponent(JSON.stringify(filtersObject));

        let mainOrders;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
            try {
                mainOrders = await getNbsOrders(token, filters, "basic");
                break;
            } catch (error) {
                retryCount++;
                console.log(`⚠️ API call failed (attempt ${retryCount}/${maxRetries}):`, error.message);

                if (retryCount >= maxRetries) {
                    throw error;
                }

                const waitTime = retryCount * 2000;
                console.log(`⏳ Waiting ${waitTime}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));

                token = await getNbsToken();
            }
        }

        const headerMapping = {
            "מספר הזמנה": "nbsOrderId",
            "מזהה לקוח": "nbsCustomerId",
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

        const orderRowProcessor = (orderData) => {
            if (!orderData.nbsOrderId) {
                return null;
            }

            // עיבוד מספרי טלפון
            if (orderData.phones && typeof orderData.phones === 'string') {
                orderData.phones = orderData.phones.split(' ').filter(phone => phone.trim() !== '');
            }

            // עיבוד תאריכים
            ['openedAt', 'closedAt'].forEach(dateField => {
                if (orderData[dateField]) {
                    if (typeof orderData[dateField] === 'number') {
                        orderData[dateField] = new Date((orderData[dateField] - 25569) * 86400 * 1000);
                    } else if (typeof orderData[dateField] === 'string') {
                        orderData[dateField] = new Date(orderData[dateField]);
                    }
                }
            });

            // עיבוד מספרים
            ['totalPrice', 'nbsOrderId', 'nbsCustomerId'].forEach(numberField => {
                if (orderData[numberField] && !isNaN(orderData[numberField])) {
                    orderData[numberField] = Number(orderData[numberField]);
                }
            });

            return orderData;
        };

        const structuredData = parseExcelToJson(mainOrders, headerMapping, orderRowProcessor);

        console.log('Parsed Orders Data:');
        console.log(`Total orders parsed: ${structuredData.length}`);

        return structuredData;

    } catch (error) {
        console.error('💥 Error during order processing:', error.message);
        throw error;
    }
};

// פונקציה לשליפת מוצרים של הזמנות
const getOrderProducts = async (token, orderIds = null, amountDaysToImport = 1) => {
    try {
        const filtersObject = {
            searchTerm: "",
            saleIds: SALE_IDS,
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
                amount: amountDaysToImport
            }
        };

        const filters = encodeURIComponent(JSON.stringify(filtersObject));

        let mainOrders;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries) {
            try {
                mainOrders = await getNbsOrders(token, filters, "weights");
                break;
            } catch (error) {
                retryCount++;
                console.log(`⚠️ API call failed (attempt ${retryCount}/${maxRetries}):`, error.message);

                if (retryCount >= maxRetries) {
                    throw error;
                }

                const waitTime = retryCount * 2000;
                console.log(`⏳ Waiting ${waitTime}ms before retry...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));

                token = await getNbsToken();
            }
        }

        const headerMapping = {
            "מספר הזמנה": "nbsOrderId",
            "מזהה פריט": "nbsProductId",
            "פריט": "productName",
            "משקל פריט": "weights",
            "מחיר פריט": "price"
        };

        const orderProductRowProcessor = (orderData) => {
            if (!orderData.nbsOrderId || !orderData.productName) {
                return null;
            }

            ['nbsOrderId', 'nbsProductId', 'weights', 'price'].forEach(numberField => {
                if (orderData[numberField] && !isNaN(orderData[numberField])) {
                    orderData[numberField] = Number(orderData[numberField]);
                }
            });

            return orderData;
        };

        const parsedData = parseExcelToJson(mainOrders, headerMapping, orderProductRowProcessor);

        // סינון לפי מספרי הזמנה ספציפיים אם נדרש
        let filteredData = parsedData;
        if (orderIds && orderIds.length > 0) {
            const orderIdSet = new Set(orderIds);
            filteredData = parsedData.filter(item => orderIdSet.has(item.nbsOrderId));
            console.log(`🔍 Filtered products from ${parsedData.length} to ${filteredData.length} based on order IDs`);
        }

        // נרמול נתונים - קיבוץ לפי הזמנה ומוצר
        console.log('🔄 Starting data normalization...');
        const productGroups = new Map();

        for (let i = 0; i < filteredData.length; i++) {
            const row = filteredData[i];
            const key = `${row.nbsOrderId}-${row.productName}`;

            if (productGroups.has(key)) {
                const existing = productGroups.get(key);
                if (row.weights && existing.weights !== undefined) {
                    existing.weights += row.weights;
                    existing.quantityOrWeight = existing.weights;
                } else if (!row.weights && existing.quantity !== undefined) {
                    existing.quantity += 1;
                    existing.quantityOrWeight = existing.quantity;
                } else if (row.weights && existing.quantity !== undefined) {
                    delete existing.quantity;
                    existing.weights = row.weights;
                    existing.quantityOrWeight = row.weights;
                } else if (!row.weights && existing.weights !== undefined) {
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

            if (i % 5000 === 0) {
                console.log(`📊 Normalized ${i}/${filteredData.length} products`);
            }
        }

        // המרה למערך וניקוי
        const normalizedData = [];
        productGroups.forEach(product => {
            delete product.quantity;
            normalizedData.push(product);
        });

        console.log('✅ Data normalization completed');
        console.log(`Total normalized products: ${normalizedData.length}`);

        return normalizedData;

    } catch (error) {
        console.error('💥 Error during order products processing:', error.message);
        throw error;
    }
};

// הפונקציה הראשית - שליפה, נרמול ושליחה לשרת
const fetchAndNormalizeOrders = async () => {
    try {
        console.log('🚀 Starting NBS data fetch and normalization...');
        const amountDaysToImport = await getAmountDaysToImport();
        // קבלת טוקן
        const token = await getNbsToken();

        // שליפת הזמנות
        console.log('📋 Fetching orders...');
        const orders = await getOrders(token, amountDaysToImport);

        if (orders.length === 0) {
            console.log('⚠️ No orders found');
            return [];
        }

        // קבלת מספרי הזמנות
        const orderIds = orders.map(order => order.nbsOrderId).filter(id => id);
        console.log(`📊 Found ${orderIds.length} order IDs`);

        // שליפת מוצרים
        console.log('📦 Fetching order products...');
        const orderProducts = await getOrderProducts(token, orderIds, amountDaysToImport);

        console.log(orderProducts[0], "orderProducts[0]");
        // יצירת מיפוי מוצרים לפי הזמנה
        console.log('🔄 Creating orders with products structure...');
        const productsByOrder = new Map();

        orderProducts.forEach(product => {
            const orderId = product.nbsOrderId;
            if (!productsByOrder.has(orderId)) {
                productsByOrder.set(orderId, []);
            }
            productsByOrder.get(orderId).push({
                productName: product.productName,
                quantityOrWeight: product.quantityOrWeight,
                weights: product.weights,
                price: product.price,
                nbsProductId: product.nbsProductId
            });
        });

        // שילוב הזמנות עם מוצרים
        const ordersWithProducts = orders.map(order => {
            const products = productsByOrder.get(order.nbsOrderId) || [];
            return {
                ...order,
                products: products
            };
        });

        console.log('✅ Data normalization completed successfully!');
        console.log(`📊 Total orders with products: ${ordersWithProducts.length}`);
        console.log(`📦 Total products across all orders: ${orderProducts.length}`);

        // שליחת הנתונים לאנדפוינט Firebase Function
        try {
            console.log('\n🚀 Sending data to Firebase Function...');
            console.log(`📊 Data size: ${JSON.stringify(ordersWithProducts).length} characters`);
            console.log(`📦 Number of orders: ${ordersWithProducts.length}`);
            const response = await axios.post(
                'https://us-central1-kanfei-nesharim2.cloudfunctions.net/test3',
                ordersWithProducts,
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer fromNodeService`
                    },
                    timeout: 540000, // 9 minutes timeout (match Firebase Function)
                    maxContentLength: Infinity,
                    maxBodyLength: Infinity
                }
            );
            console.log(`✅ Data successfully sent to Firebase Function`);
            console.log(`� Response status: ${response.status}`);
            console.log(`📋 Response data: ${response.data}`);
        } catch (sendError) {
            console.error(`\n❌ Error sending data to Firebase Function: ${sendError.message}`);
            console.error(`🔍 Error code: ${sendError.code}`);
            
            if (sendError.response) {
                console.error(`📊 Response status: ${sendError.response.status}`);
                console.error(`📥 Response data:`, sendError.response.data);
            } else if (sendError.request) {
                console.error(`📡 Request was made but no response received`);
                console.error(`🔍 Request details:`, {
                    timeout: sendError.config?.timeout,
                    method: sendError.config?.method,
                    url: sendError.config?.url
                });
            }
            
            // במקרה של כשל, נשמור גם לקובץ מקומי כגיבוי
            console.log('\n💾 Saving data locally as backup...');
            const outputPath = path.join(__dirname, 'orders_with_products_backup.json');
            fs.writeFileSync(outputPath, JSON.stringify(ordersWithProducts, null, 2), 'utf8');
            console.log(`💾 Backup saved to: ${outputPath}`);
            
            // Try once more if it's a network error
            const isRetryableError = sendError.code === 'ECONNRESET' || 
                                   sendError.code === 'ETIMEDOUT' || 
                                   sendError.message.includes('socket hang up') ||
                                   sendError.message.includes('timeout');
                                   
            if (isRetryableError) {
                console.log('\n🔄 Attempting retry due to connection issue...');
                try {
                    await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
                    
                    const retryResponse = await axios.post(
                        'https://us-central1-kanfei-nesharim2.cloudfunctions.net/test3',
                        ordersWithProducts,
                        {
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer fromNodeService`
                            },
                            timeout: 540000,
                            maxContentLength: Infinity,
                            maxBodyLength: Infinity
                        }
                    );
                    console.log(`✅ Retry successful! Response status: ${retryResponse.status}`);
                    console.log(`📋 Retry response data:`, retryResponse.data);
                } catch (retryError) {
                    console.error(`❌ Retry also failed: ${retryError.message}`);
                    throw sendError; // Throw original error
                }
            } else {
                throw sendError;
            }
        }

        return ordersWithProducts;

    } catch (error) {
        console.error('💥 Error in fetchAndNormalizeOrders:', error.message);
        throw error;
    }
};

// אם הקובץ מורץ ישירות
if (require.main === module) {
    fetchAndNormalizeOrders()
        .then(result => {
            console.log(`\n✅ Script completed successfully with ${result.length} orders`);
            // סטטיסטיקות
            const ordersWithProducts = result.filter(order => order.products && order.products.length > 0);
            const ordersWithoutProducts = result.filter(order => !order.products || order.products.length === 0);
            const totalProducts = result.reduce((sum, order) => sum + (order.products ? order.products.length : 0), 0);
            console.log('\n📊 Summary:');
            console.log(`- Total orders: ${result.length}`);
            console.log(`- Orders with products: ${ordersWithProducts.length}`);
            console.log(`- Orders without products: ${ordersWithoutProducts.length}`);
            console.log(`- Total products: ${totalProducts}`);
            process.exit(0);
        })
        .catch(error => {
            console.error('\n❌ Script failed:', error.message);
            process.exit(1);
        });
}

const getAmountDaysToImport = async () => {
    try {
        console.log('\n� Getting last import date from server...');
        const response = await axios.get(
            'https://us-central1-kanfei-nesharim2.cloudfunctions.net/lastOrderImportDate',
            {
                headers: {
                    'Content-Type': 'application/json'
                },
                timeout: 30000 // 30 seconds timeout
            }
        );

        if (response.status !== 200 || !response.data.lastImportDate) {
            console.log('⚠️ Could not get last import date, defaulting to 1 day');
            return 1;
        }

        // המרת התאריך שהתקבל לאובייקט Date
        const lastImportDate = new Date(response.data.lastImportDate);
        const currentDate = new Date();

        // חישוב ההפרש בימים
        const timeDifference = currentDate - lastImportDate;
        const daysDifference = timeDifference / (1000 * 60 * 60 * 24);

        // עיגול כלפי מעלה
        const daysToImport = Math.ceil(daysDifference);

        console.log(`📅 Last import: ${lastImportDate.toISOString()}`);
        console.log(`📅 Current date: ${currentDate.toISOString()}`);
        console.log(`📊 Days to import: ${daysToImport}`);

        // וידוא שהערך לא יהיה קטן מ-1
        return Math.max(daysToImport, 1);

    } catch (error) {
        console.error('❌ Error getting last import date:', error.message);
        console.log('⚠️ Defaulting to 1 day import');
        return 1;
    }
};

// ייצוא הפונקציות לשימוש חיצוני
module.exports = {
    fetchAndNormalizeOrders,
    getNbsToken,
    getOrders,
    getOrderProducts,
    // normalizeOrdersWithProducts
};

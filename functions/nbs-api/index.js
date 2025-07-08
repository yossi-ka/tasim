const { getNbsToken, getNbsOrders, getNbsCustomers } = require('./services');
// const { parseExcelToJson } = require('../../utils');
const { db } = require('../firebase-config');
const { parseExcelToJson } = require('../utils');
const { Timestamp } = require("firebase-admin/firestore");

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

// const getCustomers = async () => {
//     try {
//         // Create filters object for API request
//         const filtersObject = {
//             searchTerm: "",
//             saleIds: [],
//             branchIds: [],
//             createdRange: null,
//             updatedRange: null,
//             status: ["active"]
//         };

//         // Convert to URL-encoded string for API
//         const filters = encodeURIComponent(JSON.stringify(filtersObject));

//         const token = await getNbsToken();
//         const mainCustomers = await getNbsCustomers(token, filters);

//         // Map Hebrew headers to English field names
//         const headerMapping = {
//             "מזהה": "nbsCustomerId",
//             "שם משפחה": "lastName",
//             "שם פרטי": "firstName",
//             "טלפון": "phones",
//             "אמייל": "email",
//             "תז": "idNumber",
//             "IVR": "isIvr",
//             "שופי": "isShoppi",
//             "סטטוס": "nbsStatus",
//             "תאריך הצטרפות": "createDate"
//         };

//         // Row processor function for customers
//         const customerRowProcessor = (customerData) => {
//             // Skip rows without customer ID
//             if (!customerData.nbsCustomerId) {
//                 return null;
//             }

//             // Special handling for phones - split by space into array
//             if (customerData.phones && typeof customerData.phones === 'string') {
//                 customerData.phones = customerData.phones.split(' ').filter(phone => phone.trim() !== '');
//             }

//             // Handle boolean fields - convert v/x to boolean
//             ['isIvr', 'isShoppi'].forEach(boolField => {
//                 if (customerData[boolField] !== undefined) {
//                     const value = String(customerData[boolField]).toLowerCase();
//                     customerData[boolField] = value === 'v' || value === 'true' || value === '1';
//                 }
//             });

//             // Handle dates
//             ['createDate'].forEach(dateField => {
//                 if (customerData[dateField]) {
//                     if (typeof customerData[dateField] === 'number') {
//                         // Excel serial date
//                         customerData[dateField] = new Date((customerData[dateField] - 25569) * 86400 * 1000);
//                     } else if (typeof customerData[dateField] === 'string') {
//                         customerData[dateField] = new Date(customerData[dateField]);
//                     }
//                 }
//             });

//             // Handle numbers
//             if (customerData.nbsCustomerId && !isNaN(customerData.nbsCustomerId)) {
//                 customerData.nbsCustomerId = Number(customerData.nbsCustomerId);
//             }

//             return customerData;
//         };

//         // Use the generic Excel parser
//         const structuredData = parseExcelToJson(mainCustomers, headerMapping, customerRowProcessor);

//         console.log('Parsed Customers Data:');
//         console.log(JSON.stringify(structuredData, null, 2));
//         console.log(`Total customers parsed: ${structuredData.length}`);

//         return structuredData;

//     } catch (error) {
//         console.error('💥 Error during customer upload:', error.message);
//         throw error;
//     }
// }

const getOrderByNbsOrderId = async (nbsOrderId) => {
    try {
        const q = db.collection('orders')
            .where('nbsOrderId', '==', nbsOrderId)
            .limit(1);
        const snapshot = await q.get();
        if (snapshot.empty) {
            console.log(`No order found with NBS Order ID: ${nbsOrderId}`);
            return null;
        }
        const orderDoc = snapshot.docs[0];
        return {
            id: orderDoc.id,
            ...orderDoc.data()
        };
    } catch (error) {
        console.error('💥 Error fetching order by NBS Order ID:', error.message)
        throw error;
    }
}

const refreshOrders = async () => {
    // Configuration: Limit number of orders to process for testing
    const MAX_ORDERS_TO_PROCESS = 500; // Change this number as needed

    const newDoc = db.collection('importOrders').doc();
    await newDoc.set({
        createdAt: Timestamp.now(),
        complitedAt: null,
        status: 'started',
        message: `Refreshing orders from NBS (limited to ${MAX_ORDERS_TO_PROCESS} orders)...`
    });
    try {

        const token = await getNbsToken();
        console.log('🔄 Refreshing orders...');
        const BATCH_SIZE = 500; // Maximum updates per batch
        console.log(418)
        const allNbsOrders = await getOrders(token);
        console.log(420)

        // Limit the number of orders to process
        const nbsOrders = allNbsOrders.slice(0, MAX_ORDERS_TO_PROCESS);
        console.log(`📊 Limited processing to ${nbsOrders.length} orders out of ${allNbsOrders.length} total orders`);

        let totalNewOrders = 0;
        let totalProductsAdded = 0;

        // Find min and max nbsOrderId for efficient querying
        const nbsOrderIds = nbsOrders.map(order => order.nbsOrderId).filter(id => id);
        if (nbsOrderIds.length === 0) {
            console.log('⚠️ No valid order IDs found');
            await newDoc.update({
                status: 'completed',
                totalNewOrders: 0,
                message: 'No valid order IDs found',
                complitedAt: Timestamp.now(),
            });
            return 0;
        }

        // Load product mapping and order products in parallel for efficiency
        console.log('🔄 Loading data in parallel...');
        let productMapping, allOrderProducts;
        console.log("443")
        try {
            [productMapping, allOrderProducts] = await Promise.all([
                loadProductMapping(),
                getOrderProducts(token, nbsOrderIds) // Pass the specific order IDs
            ]);
        } catch (error) {
            console.log('⚠️ Parallel loading failed, trying sequential loading...');
            // If parallel fails, try sequential
            productMapping = await loadProductMapping();

            // Add delay before second call
            console.log('⏳ Waiting 5 seconds before getting order products...');
            await new Promise(resolve => setTimeout(resolve, 5000));

            allOrderProducts = await getOrderProducts(token, nbsOrderIds); // Pass the specific order IDs
        }
        console.log(460)


        const minOrderId = Math.min(...nbsOrderIds);
        const maxOrderId = Math.max(...nbsOrderIds);

        console.log(`📊 Order ID range: ${minOrderId} - ${maxOrderId} (Total: ${nbsOrderIds.length} orders)`);

        // Get all existing orders in the range with a single query
        console.log('🔍 Fetching existing orders from Firebase...');
        const existingOrdersSnapshot = await db.collection('orders')
            .where('nbsOrderId', '>=', minOrderId)
            .where('nbsOrderId', '<=', maxOrderId)
            .get();

        console.log(existingOrdersSnapshot.docs.length, 'existing orders found in Firebase');

        // Create a Set of existing order IDs for fast lookup
        const existingOrderIds = new Set();
        existingOrdersSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.nbsOrderId) {
                existingOrderIds.add(data.nbsOrderId);
            }
        });

        console.log(`📋 Found ${existingOrderIds.size} existing orders in Firebase`);

        // Process orders in batches considering order + products count
        let currentBatchOperations = 0;
        let batch = db.batch();
        let newOrders = [];
        let currentBatchIndex = 1;

        console.log(494)
        for (let i = 0; i < nbsOrders.length; i++) {
            const order = nbsOrders[i];

            // Fast local check instead of Firebase query
            if (existingOrderIds.has(order.nbsOrderId)) {
                continue; // Skip if order already exists
            }

            // Calculate how many operations this order will need (1 for order + products count)
            const thisOrderProducts = allOrderProducts.filter(product => product.nbsOrderId === order.nbsOrderId);
            const mappedProducts = thisOrderProducts.filter(orderProduct =>
                productMapping.has(orderProduct.productName)
            );
            const operationsForThisOrder = 1 + mappedProducts.length; // 1 order + N products

            console.log(510, operationsForThisOrder)
            // Special handling for orders with more than BATCH_SIZE products
            if (operationsForThisOrder > BATCH_SIZE) {
                console.log(`⚠️ Order ${order.nbsOrderId} has ${mappedProducts.length} products (>${BATCH_SIZE}), processing in dedicated batch`);

                // Commit current batch if it has operations
                if (currentBatchOperations > 0) {
                    await batch.commit();
                    totalNewOrders += newOrders.length;
                    console.log(`✅ Batch ${currentBatchIndex} committed with ${newOrders.length} orders and ${currentBatchOperations} total operations`);
                    currentBatchIndex++;
                }

                // Process this large order in its own batch
                const largeBatch = db.batch();

                // Add order to dedicated batch
                const orderRef = db.collection('orders').doc();
                largeBatch.set(orderRef, {
                    ...order,
                    orderStatus: 1,
                    createdBy: "system",
                    createdDate: Timestamp.now(),
                    updateBy: "system",
                    updateDate: Timestamp.now(),
                    isActive: true,
                    importId: newDoc.id,
                });

                // Add all products for this order to the same dedicated batch
                mappedProducts.forEach(orderProduct => {
                    const mappedProduct = productMapping.get(orderProduct.productName);
                    const productRef = db.collection('orderProducts').doc();
                    largeBatch.set(productRef, {
                        orderId: orderRef.id,
                        nbsOrderId: order.nbsOrderId,
                        productId: mappedProduct.id,
                        productName: orderProduct.productName,
                        quantityOrWeight: orderProduct.quantityOrWeight,
                        weights: orderProduct.weights,
                        price: orderProduct.price,
                        createdAt: Timestamp.now(),
                        createdBy: "system",
                        importId: newDoc.id,
                    });
                    totalProductsAdded++;
                });

                // Commit the large batch
                await largeBatch.commit();
                totalNewOrders += 1;
                console.log(`✅ Large order batch ${currentBatchIndex} committed with 1 order and ${operationsForThisOrder} total operations`);
                currentBatchIndex++;

                // Reset regular batch
                batch = db.batch();
                newOrders = [];
                currentBatchOperations = 0;

                if (thisOrderProducts.length > mappedProducts.length) {
                    console.log(`⚠️ Order ${order.nbsOrderId}: ${thisOrderProducts.length - mappedProducts.length} products not found in mapping`);
                }

                continue; // Skip to next order
            }

            // Check if adding this order would exceed batch limit
            if (currentBatchOperations + operationsForThisOrder > BATCH_SIZE && currentBatchOperations > 0) {
                // Commit current batch first
                if (newOrders.length > 0) {
                    await batch.commit();
                    totalNewOrders += newOrders.length;
                    console.log(`✅ Batch ${currentBatchIndex} committed with ${newOrders.length} orders and ${currentBatchOperations} total operations`);
                    currentBatchIndex++;
                }

                // Start new batch
                batch = db.batch();
                newOrders = [];
                currentBatchOperations = 0;
            }

            // Add order to batch
            const orderRef = db.collection('orders').doc();
            batch.set(orderRef, {
                ...order,
                orderStatus: 1,
                createdBy: "system",
                createdDate: Timestamp.now(),
                updateBy: "system",
                updateDate: Timestamp.now(),
                isActive: true,
                importId: newDoc.id,
            });

            const newOrder = {
                id: orderRef.id,
                nbsOrderId: order.nbsOrderId,
                ...order
            };
            newOrders.push(newOrder);
            currentBatchOperations += 1;

            console.log(mappedProducts.length, 'mapped products for order', order.nbsOrderId);
            // Add products for this order to the same batch
            mappedProducts.forEach(orderProduct => {
                const mappedProduct = productMapping.get(orderProduct.productName);
                const productRef = db.collection('orderProducts').doc();
                batch.set(productRef, {
                    orderId: orderRef.id,
                    nbsOrderId: order.nbsOrderId,
                    productId: mappedProduct.id,
                    productName: orderProduct.productName,
                    quantityOrWeight: orderProduct.quantityOrWeight,
                    weights: orderProduct.weights,
                    price: orderProduct.price,
                    createdAt: Timestamp.now(),
                    createdBy: "system",
                    importId: newDoc.id,
                });
                totalProductsAdded++;
                currentBatchOperations += 1;
            });

            if (thisOrderProducts.length > mappedProducts.length) {
                console.log(`⚠️ Order ${order.nbsOrderId}: ${thisOrderProducts.length - mappedProducts.length} products not found in mapping`);
            }

            console.log(`📦 Prepared order ${order.nbsOrderId} with ${mappedProducts.length} products (${operationsForThisOrder} operations)`);
        }

        // Commit final batch if it has any operations
        if (currentBatchOperations > 0) {
            await batch.commit();
            totalNewOrders += newOrders.length;
            console.log(`✅ Final batch ${currentBatchIndex} committed with ${newOrders.length} orders and ${currentBatchOperations} total operations`);
        }

        console.log(`✅ Orders refreshed successfully. Total new orders: ${totalNewOrders}, Total products added: ${totalProductsAdded}`);
        newDoc.update({
            status: 'completed',
            message: `Orders refreshed successfully (${MAX_ORDERS_TO_PROCESS} orders limit). Total new orders: ${totalNewOrders}, Total products added: ${totalProductsAdded}`,
            totalNewOrders: totalNewOrders,
            totalProductsAdded: totalProductsAdded,
            maxOrdersLimit: MAX_ORDERS_TO_PROCESS,
            complitedAt: Timestamp.now()
        });
        return totalNewOrders;
    } catch (error) {
        console.error('💥 Error refreshing orders:', error.message);
        newDoc.update({
            status: 'failed',
            message: `Error refreshing orders: ${error.message}`,
            complitedAt: Timestamp.now()
        })
        throw error;
    }
};

// Helper function to load product mapping for efficient lookups
const loadProductMapping = async () => {
    try {
        console.log('🔄 Loading product mapping...');
        const productsSnapshot = await db.collection('products')
            .select('orginalFullName') // Only fetch the field we need
            .get();

        const productMapping = new Map();
        productsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.orginalFullName) {
                productMapping.set(data.orginalFullName, {
                    id: doc.id,
                    orginalFullName: data.orginalFullName
                });
            }
        });

        console.log(`📋 Loaded ${productMapping.size} products for mapping`);
        return productMapping;
    } catch (error) {
        console.error('💥 Error loading product mapping:', error.message);
        throw error;
    }
};

module.exports = {
    getOrders,
    getOrderProducts,
    refreshOrders
};
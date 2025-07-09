// import { db, functions } from '../../firebase-config'
// import { addDoc, collection, doc, getDocs, query, where, writeBatch, Timestamp, updateDoc } from "firebase/firestore";
// import { httpsCallable } from "firebase/functions";

// const BASE_NBS_URL = "https://sales-v2.nbs-app.net/api/crm/";

// // פונקציות עזר לעבודה עם NBS API
// const getNbsToken = async () => {
//     console.log('🔐 Starting authentication process...');

//     const userName = "naftali";
//     const password = "naftali2015";

//     if (!userName || !password) {
//         console.error('❌ NBS credentials are missing from environment variables');
//         throw new Error('NBS credentials are not set in environment variables');
//     }

//     let data = JSON.stringify({
//         "email": userName,
//         "username": userName,
//         "password": password
//     });

//     let config = {
//         method: 'post',
//         maxBodyLength: Infinity,
//         url: BASE_NBS_URL + 'auth/login/',
//         headers: {
//             'Accept': 'application/json, text/plain, */*',
//             'Origin': 'https://crm.shoppi.co.il',
//             'Referer': 'https://crm.shoppi.co.il/',
//             'Sec-Fetch-Site': 'cross-site',
//             'Sec-Fetch-Mode': 'cors',
//             'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
//             'Content-Type': 'application/json'
//         },
//         data: data
//     };

//     try {
//         const res = await axios.request(config);

//         if (res.status !== 200 || res.data.status !== 'success') {
//             console.error('❌ Authentication failed:', res.status, res.statusText);
//             throw new Error(`Failed to get token: ${res.status} ${res.statusText}`);
//         }

//         console.log('🎉 Authentication successful! Token received.');
//         return res.data.data.access;

//     } catch (error) {
//         console.error('💥 Error during authentication:', error.message);
//         if (error.response) {
//             console.error('📥 Error response status:', error.response.status);
//             console.error('📥 Error response data:', error.response.data);
//         }
//         throw error;
//     }
// };

// const getNbsOrders = async (token, filters, exportType) => {
//     console.log('📦 Fetching orders with filters:', filters);
//     let config = {
//         method: 'get',
//         maxBodyLength: Infinity,
//         url: `${BASE_NBS_URL}order/report/export-xlsx/?filters=${filters}&sort=%7B%22sortBy%22:%22%22,%22sortDir%22:%22desc%22%7D&exportType=${exportType}`,
//         headers: {
//             'Accept': 'application/json, text/plain, */*',
//             'Origin': 'https://crm.shoppi.co.il',
//             'Referer': 'https://crm.shoppi.co.il/',
//             'Sec-Fetch-Site': 'cross-site',
//             'Sec-Fetch-Mode': 'cors',
//             'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/137.0.0.0 Mobile Safari/537.36',
//             'Authorization': 'Bearer ' + token
//         },
//         responseType: 'arraybuffer'  // Important: Handle binary Excel data
//     };

//     try {
//         const res = await axios.request(config);

//         if (res.status !== 200) {
//             console.error('❌ Failed to fetch orders:', res.status, res.statusText);
//             throw new Error(`Failed to get orders: ${res.status} ${res.statusText}`);
//         }

//         console.log('✅ Orders data received successfully');
//         return res.data;

//     } catch (error) {
//         console.error('💥 Error fetching orders:', error.message);
//         if (error.response) {
//             console.error('📥 Error response status:', error.response.status);
//             console.error('📥 Error response headers:', error.response.headers);
//         }
//         throw error;
//     }
// };

// // פונקציה לפרסור Excel לJSON (מותאמת ל-browser)
// const parseExcelToJson = (excelResponse, headerMapping, rowProcessor = null) => {
//     return new Promise((resolve, reject) => {
//         try {
//             console.log('📊 Starting Excel parsing...');

//             // נייבא את XLSX באופן דינמי
//             import('xlsx').then(XLSX => {
//                 let workbook;
//                 if (excelResponse instanceof ArrayBuffer) {
//                     workbook = XLSX.read(excelResponse, { type: 'array' });
//                 } else if (excelResponse instanceof Uint8Array) {
//                     workbook = XLSX.read(excelResponse, { type: 'array' });
//                 } else {
//                     workbook = XLSX.read(new Uint8Array(excelResponse), { type: 'array' });
//                 }

//                 const sheetName = workbook.SheetNames[0];
//                 const worksheet = workbook.Sheets[sheetName];

//                 console.log('📋 Excel workbook parsed, processing sheet...');

//                 const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
//                     header: 1,
//                     defval: '',
//                     raw: false
//                 });

//                 if (jsonData.length === 0) {
//                     console.log('⚠️ No data found in Excel file');
//                     resolve([]);
//                     return;
//                 }

//                 const headers = jsonData[0];
//                 console.log('📋 Headers found:', headers);

//                 console.log(`🔄 Processing ${jsonData.length - 1} data rows...`);
//                 const structuredData = [];
                
//                 for (let i = 1; i < jsonData.length; i++) {
//                     const row = jsonData[i];
//                     const rowData = {};

//                     for (let headerIndex = 0; headerIndex < headers.length; headerIndex++) {
//                         const header = headers[headerIndex];
//                         const fieldName = headerMapping[header];
//                         if (fieldName && row[headerIndex] !== undefined && row[headerIndex] !== '') {
//                             rowData[fieldName] = row[headerIndex];
//                         }
//                     }

//                     let processedRow;
//                     if (rowProcessor && typeof rowProcessor === 'function') {
//                         processedRow = rowProcessor(rowData, row, i - 1);
//                     } else {
//                         processedRow = rowData;
//                     }

//                     if (processedRow && Object.keys(processedRow).length > 0) {
//                         structuredData.push(processedRow);
//                     }

//                     if (i % 500 === 0) {
//                         console.log(`📊 Processed ${i - 1}/${jsonData.length - 1} rows`);
//                     }
//                 }

//                 console.log(`✅ Excel parsing completed. Total rows processed: ${structuredData.length}`);
//                 resolve(structuredData);

//             }).catch(error => {
//                 console.error('💥 Error importing XLSX:', error);
//                 reject(new Error(`Failed to import XLSX library: ${error.message}`));
//             });

//         } catch (error) {
//             console.error('💥 Error parsing Excel file:', error.message);
//             reject(new Error(`Excel parsing failed: ${error.message}`));
//         }
//     });
// };

// const getOrders = async (token) => {
//     try {
//         // Create filters object for API request
//         const filtersObject = {
//             searchTerm: "",
//             saleIds: [],
//             branchIds: [],
//             paymentMethod: [],
//             status: ["paid"],
//             createdVia: [],
//             shippingMethod: [],
//             sumRange: {
//                 from: 0,
//                 to: 0
//             },
//             updatedRange: {
//                 unit: "days",
//                 amount: 1
//             }
//         };

//         // Convert to URL-encoded string for API
//         const filters = encodeURIComponent(JSON.stringify(filtersObject));

//         if (!token) {
//             token = await getNbsToken();
//         }

//         let mainOrders;
//         let retryCount = 0;
//         const maxRetries = 3;

//         while (retryCount < maxRetries) {
//             try {
//                 mainOrders = await getNbsOrders(token, filters, "basic");
//                 break; // Success, exit retry loop
//             } catch (error) {
//                 retryCount++;
//                 console.log(`⚠️ API call failed (attempt ${retryCount}/${maxRetries}):`, error.message);

//                 if (retryCount >= maxRetries) {
//                     throw error; // Max retries reached, throw error
//                 }

//                 // Wait before retry, with exponential backoff
//                 const waitTime = retryCount * 2000; // 2s, 4s, 6s
//                 console.log(`⏳ Waiting ${waitTime}ms before retry...`);
//                 await new Promise(resolve => setTimeout(resolve, waitTime));

//                 // Get new token on retry
//                 token = await getNbsToken();
//             }
//         }

//         // Map Hebrew headers to English field names
//         const headerMapping = {
//             "מספר הזמנה": "nbsOrderId",
//             "שם פרטי": "firstName",
//             "שם משפחה": "lastName",
//             "ת.ז": "idNumber",
//             "טלפון": "phones",
//             "אמייל": "email",
//             "עיר": "city",
//             "כתובת": "street",
//             "תאריך ביצוע": "openedAt",
//             "תאריך עדכון": "closedAt",
//             "סטטוס": "nbsOrderStatus",
//             "אופן תשלום": "paymentMethod",
//             "סה\"כ": "totalPrice",
//             "הערה": "orderNote",
//             "מידע נוסף": "moreInfo"
//         };

//         // Row processor function for orders
//         const orderRowProcessor = (orderData) => {
//             // Skip rows without order ID
//             if (!orderData.nbsOrderId) {
//                 return null;
//             }

//             // Special handling for phones - split by space into array
//             if (orderData.phones && typeof orderData.phones === 'string') {
//                 orderData.phones = orderData.phones.split(' ').filter(phone => phone.trim() !== '');
//             }

//             // Handle dates
//             ['openedAt', 'closedAt'].forEach(dateField => {
//                 if (orderData[dateField]) {
//                     if (typeof orderData[dateField] === 'number') {
//                         // Excel serial date
//                         orderData[dateField] = new Date((orderData[dateField] - 25569) * 86400 * 1000);
//                     } else if (typeof orderData[dateField] === 'string') {
//                         orderData[dateField] = new Date(orderData[dateField]);
//                     }
//                 }
//             });

//             // Handle numbers
//             ['totalPrice', 'nbsOrderId'].forEach(numberField => {
//                 if (orderData[numberField] && !isNaN(orderData[numberField])) {
//                     orderData[numberField] = Number(orderData[numberField]);
//                 }
//             });

//             return orderData;
//         };

//         // Use the generic Excel parser
//         const structuredData = await parseExcelToJson(mainOrders, headerMapping, orderRowProcessor);

//         console.log('Parsed Orders Data:');
//         console.log(`Total orders parsed: ${structuredData.length}`);

//         return structuredData;

//     } catch (error) {
//         console.error('💥 Error during order upload:', error.message);
//         throw error;
//     }
// };

// const getOrderProducts = async (token, specificOrderIds = null) => {
//     try {
//         // Create filters object for API request
//         const filtersObject = {
//             searchTerm: "",
//             saleIds: [], // Filter by specific order IDs if provided
//             branchIds: [],
//             paymentMethod: [],
//             status: ["paid"],
//             createdVia: [],
//             shippingMethod: [],
//             sumRange: {
//                 from: 0,
//                 to: 0
//             },
//             updatedRange: {
//                 unit: "days",
//                 amount: 1
//             }
//         };

//         // Convert to URL-encoded string for API
//         const filters = encodeURIComponent(JSON.stringify(filtersObject));

//         if (!token) {
//             token = await getNbsToken();
//         }

//         let mainOrders;
//         let retryCount = 0;
//         const maxRetries = 3;

//         while (retryCount < maxRetries) {
//             try {
//                 mainOrders = await getNbsOrders(token, filters, "weights");
//                 break; // Success, exit retry loop
//             } catch (error) {
//                 retryCount++;
//                 console.log(`⚠️ API call failed (attempt ${retryCount}/${maxRetries}):`, error.message);

//                 if (retryCount >= maxRetries) {
//                     throw error; // Max retries reached, throw error
//                 }

//                 // Wait before retry, with exponential backoff
//                 const waitTime = retryCount * 2000; // 2s, 4s, 6s
//                 console.log(`⏳ Waiting ${waitTime}ms before retry...`);
//                 await new Promise(resolve => setTimeout(resolve, waitTime));

//                 // Get new token on retry
//                 token = await getNbsToken();
//             }
//         }

//         // Map Hebrew headers to English field names - only required columns
//         const headerMapping = {
//             "מספר הזמנה": "nbsOrderId",
//             "פריט": "productName",
//             "משקל פריט": "weights",
//             "מחיר פריט": "price"
//         };

//         // Row processor function for order products
//         const orderProductRowProcessor = (orderData) => {
//             // Skip rows without order ID or product name
//             if (!orderData.nbsOrderId || !orderData.productName) {
//                 return null;
//             }

//             // Handle numbers
//             ['nbsOrderId', 'weights', 'price'].forEach(numberField => {
//                 if (orderData[numberField] && !isNaN(orderData[numberField])) {
//                     orderData[numberField] = Number(orderData[numberField]);
//                 }
//             });

//             return orderData;
//         };

//         // Use the generic Excel parser
//         const parsedData = await parseExcelToJson(mainOrders, headerMapping, orderProductRowProcessor);

//         console.log('212-specificOrderIds', JSON.stringify(specificOrderIds, null, 2),
//             `Parsed Order Products Data: ${parsedData.length} items`);
//         // If specific order IDs were provided, filter the results
//         let filteredData = parsedData;
//         if (specificOrderIds && specificOrderIds.length > 0) {
//             const orderIdSet = new Set(specificOrderIds);
//             filteredData = parsedData.filter(item => orderIdSet.has(item.nbsOrderId));
//             console.log(`🔍 Filtered products from ${parsedData.length} to ${filteredData.length} based on order IDs`);
//         }
//         console.log('220-filteredData', filteredData.length, 'items');

//         // Normalize data - group by order and product, sum quantities/weights (optimized)
//         console.log('🔄 Starting data normalization...');
//         const productGroups = new Map();

//         console.log('227');

//         for (let i = 0; i < filteredData.length; i++) {
//             const row = filteredData[i];
//             const key = `${row.nbsOrderId}-${row.productName}`;

//             if (productGroups.has(key)) {
//                 const existing = productGroups.get(key);
//                 // Sum weights if exists, otherwise increment quantity
//                 if (row.weights && existing.weights !== undefined) {
//                     existing.weights += row.weights;
//                     existing.quantityOrWeight = existing.weights;
//                 } else if (!row.weights && existing.quantity !== undefined) {
//                     existing.quantity += 1;
//                     existing.quantityOrWeight = existing.quantity;
//                 } else if (row.weights && existing.quantity !== undefined) {
//                     // Convert quantity to weight-based
//                     delete existing.quantity;
//                     existing.weights = row.weights;
//                     existing.quantityOrWeight = row.weights;
//                 } else if (!row.weights && existing.weights !== undefined) {
//                     // Keep existing weight, don't add quantity
//                     existing.quantityOrWeight = existing.weights;
//                 }
//             } else {
//                 const newProduct = { ...row };
//                 if (row.weights) {
//                     newProduct.quantityOrWeight = row.weights;
//                 } else {
//                     newProduct.quantity = 1;
//                     newProduct.quantityOrWeight = 1;
//                 }
//                 productGroups.set(key, newProduct);
//             }

//             // Progress logging every 5000 items
//             if (i % 5000 === 0) {
//                 console.log(`📊 Normalized ${i}/${filteredData.length} products`);
//             }
//         }

//         console.log('269');

//         // Convert map to array and clean up
//         const normalizedData = [];
//         productGroups.forEach(product => {
//             delete product.quantity; // Clean up temporary fields
//             normalizedData.push(product);
//         });

//         console.log('✅ Data normalization completed', normalizedData.length, normalizedData.length != 0 ? normalizedData[0] : 'No data');

//         console.log('Parsed and Normalized Order Products Data:');
//         console.log(`Total normalized products: ${normalizedData.length}`);

//         console.log('284');

//         return normalizedData;

//     } catch (error) {
//         console.error('💥 Error during order products processing:', error.message);
//         throw error;
//     }
// };

// // Helper function to load product mapping for efficient lookups
// const loadProductMapping = async () => {
//     try {
//         console.log('🔄 Loading product mapping...');
//         const productsSnapshot = await getDocs(collection(db, 'products'));

//         const productMapping = new Map();
//         productsSnapshot.forEach(doc => {
//             const data = doc.data();
//             if (data.orginalFullName) {
//                 productMapping.set(data.orginalFullName, {
//                     id: doc.id,
//                     orginalFullName: data.orginalFullName
//                 });
//             }
//         });

//         console.log(`📋 Loaded ${productMapping.size} products for mapping`);
//         return productMapping;
//     } catch (error) {
//         console.error('💥 Error loading product mapping:', error.message);
//         throw error;
//     }
// };

// // הפונקציה הראשית לרענון הזמנות
// export const refreshOrders = async (userId) => {
//     // Configuration: Limit number of orders to process for testing
//     const MAX_ORDERS_TO_PROCESS = 500; // Change this number as needed

//     const newDoc = await addDoc(collection(db, 'importOrders'), {
//         createdAt: Timestamp.now(),
//         complitedAt: null,
//         status: 'started',
//         message: `Refreshing orders from NBS (limited to ${MAX_ORDERS_TO_PROCESS} orders)...`
//     });

//     try {
//         const token = await getNbsToken();
//         console.log('🔄 Refreshing orders...');
//         const BATCH_SIZE = 500; // Maximum updates per batch
//         console.log(418);
//         const allNbsOrders = await getOrders(token);
//         console.log(420);

//         // Limit the number of orders to process
//         const nbsOrders = allNbsOrders.slice(0, MAX_ORDERS_TO_PROCESS);
//         console.log(`📊 Limited processing to ${nbsOrders.length} orders out of ${allNbsOrders.length} total orders`);

//         let totalNewOrders = 0;
//         let totalProductsAdded = 0;

//         // Find min and max nbsOrderId for efficient querying
//         const nbsOrderIds = nbsOrders.map(order => order.nbsOrderId).filter(id => id);
//         if (nbsOrderIds.length === 0) {
//             console.log('⚠️ No valid order IDs found');
//             await updateDoc(doc(db, 'importOrders', newDoc.id), {
//                 status: 'completed',
//                 totalNewOrders: 0,
//                 message: 'No valid order IDs found',
//                 complitedAt: Timestamp.now(),
//             });
//             return 0;
//         }

//         // Load product mapping and order products in parallel for efficiency
//         console.log('🔄 Loading data in parallel...');
//         let productMapping, allOrderProducts;
//         console.log("443");
//         try {
//             [productMapping, allOrderProducts] = await Promise.all([
//                 loadProductMapping(),
//                 getOrderProducts(token, nbsOrderIds) // Pass the specific order IDs
//             ]);
//         } catch (error) {
//             console.log('⚠️ Parallel loading failed, trying sequential loading...');
//             // If parallel fails, try sequential
//             productMapping = await loadProductMapping();

//             // Add delay before second call
//             console.log('⏳ Waiting 5 seconds before getting order products...');
//             await new Promise(resolve => setTimeout(resolve, 5000));

//             allOrderProducts = await getOrderProducts(token, nbsOrderIds); // Pass the specific order IDs
//         }
//         console.log(460);

//         const minOrderId = Math.min(...nbsOrderIds);
//         const maxOrderId = Math.max(...nbsOrderIds);

//         console.log(`📊 Order ID range: ${minOrderId} - ${maxOrderId} (Total: ${nbsOrderIds.length} orders)`);

//         // Get all existing orders in the range with a single query
//         console.log('🔍 Fetching existing orders from Firebase...');
//         const existingOrdersSnapshot = await getDocs(query(
//             collection(db, 'orders'),
//             where('nbsOrderId', '>=', minOrderId),
//             where('nbsOrderId', '<=', maxOrderId)
//         ));

//         console.log(existingOrdersSnapshot.docs.length, 'existing orders found in Firebase');

//         // Create a Set of existing order IDs for fast lookup
//         const existingOrderIds = new Set();
//         existingOrdersSnapshot.docs.forEach(doc => {
//             const data = doc.data();
//             if (data.nbsOrderId) {
//                 existingOrderIds.add(data.nbsOrderId);
//             }
//         });

//         console.log(`📋 Found ${existingOrderIds.size} existing orders in Firebase`);

//         // Process orders in batches considering order + products count
//         let currentBatchOperations = 0;
//         let batch = writeBatch(db);
//         let newOrders = [];
//         let currentBatchIndex = 1;

//         console.log(494);
//         for (let i = 0; i < nbsOrders.length; i++) {
//             const order = nbsOrders[i];

//             // Fast local check instead of Firebase query
//             if (existingOrderIds.has(order.nbsOrderId)) {
//                 continue; // Skip if order already exists
//             }

//             // Calculate how many operations this order will need (1 for order + products count)
//             const thisOrderProducts = allOrderProducts.filter(product => product.nbsOrderId === order.nbsOrderId);
//             const mappedProducts = thisOrderProducts.filter(orderProduct =>
//                 productMapping.has(orderProduct.productName)
//             );
//             const operationsForThisOrder = 1 + mappedProducts.length; // 1 order + N products

//             console.log(510, operationsForThisOrder);
//             // Special handling for orders with more than BATCH_SIZE products
//             if (operationsForThisOrder > BATCH_SIZE) {
//                 console.log(`⚠️ Order ${order.nbsOrderId} has ${mappedProducts.length} products (>${BATCH_SIZE}), processing in dedicated batch`);

//                 // Commit current batch if it has operations
//                 if (currentBatchOperations > 0) {
//                     await batch.commit();
//                     totalNewOrders += newOrders.length;
//                     console.log(`✅ Batch ${currentBatchIndex} committed with ${newOrders.length} orders and ${currentBatchOperations} total operations`);
//                     currentBatchIndex++;
//                 }

//                 // Process this large order in its own batch
//                 const largeBatch = writeBatch(db);

//                 // Add order to dedicated batch
//                 const orderRef = doc(collection(db, 'orders'));
//                 largeBatch.set(orderRef, {
//                     ...order,
//                     orderStatus: 1,
//                     createdBy: userId || "system",
//                     createdDate: Timestamp.now(),
//                     updateBy: userId || "system",
//                     updateDate: Timestamp.now(),
//                     isActive: true,
//                     importId: newDoc.id,
//                 });

//                 // Add all products for this order to the same dedicated batch
//                 mappedProducts.forEach(orderProduct => {
//                     const mappedProduct = productMapping.get(orderProduct.productName);
//                     const productRef = doc(collection(db, 'orderProducts'));
//                     largeBatch.set(productRef, {
//                         orderId: orderRef.id,
//                         nbsOrderId: order.nbsOrderId,
//                         productId: mappedProduct.id,
//                         productName: orderProduct.productName,
//                         quantityOrWeight: orderProduct.quantityOrWeight,
//                         weights: orderProduct.weights,
//                         price: orderProduct.price,
//                         createdAt: Timestamp.now(),
//                         createdBy: userId || "system",
//                         importId: newDoc.id,
//                     });
//                     totalProductsAdded++;
//                 });

//                 // Commit the large batch
//                 await largeBatch.commit();
//                 totalNewOrders += 1;
//                 console.log(`✅ Large order batch ${currentBatchIndex} committed with 1 order and ${operationsForThisOrder} total operations`);
//                 currentBatchIndex++;

//                 // Reset regular batch
//                 batch = writeBatch(db);
//                 newOrders = [];
//                 currentBatchOperations = 0;

//                 if (thisOrderProducts.length > mappedProducts.length) {
//                     console.log(`⚠️ Order ${order.nbsOrderId}: ${thisOrderProducts.length - mappedProducts.length} products not found in mapping`);
//                 }

//                 continue; // Skip to next order
//             }

//             // Check if adding this order would exceed batch limit
//             if (currentBatchOperations + operationsForThisOrder > BATCH_SIZE && currentBatchOperations > 0) {
//                 // Commit current batch first
//                 if (newOrders.length > 0) {
//                     await batch.commit();
//                     totalNewOrders += newOrders.length;
//                     console.log(`✅ Batch ${currentBatchIndex} committed with ${newOrders.length} orders and ${currentBatchOperations} total operations`);
//                     currentBatchIndex++;
//                 }

//                 // Start new batch
//                 batch = writeBatch(db);
//                 newOrders = [];
//                 currentBatchOperations = 0;
//             }

//             // Add order to batch
//             const orderRef = doc(collection(db, 'orders'));
//             batch.set(orderRef, {
//                 ...order,
//                 orderStatus: 1,
//                 createdBy: userId || "system",
//                 createdDate: Timestamp.now(),
//                 updateBy: userId || "system",
//                 updateDate: Timestamp.now(),
//                 isActive: true,
//                 importId: newDoc.id,
//             });

//             const newOrder = {
//                 id: orderRef.id,
//                 nbsOrderId: order.nbsOrderId,
//                 ...order
//             };
//             newOrders.push(newOrder);
//             currentBatchOperations += 1;

//             console.log(mappedProducts.length, 'mapped products for order', order.nbsOrderId);
//             // Add products for this order to the same batch
//             mappedProducts.forEach(orderProduct => {
//                 const mappedProduct = productMapping.get(orderProduct.productName);
//                 const productRef = doc(collection(db, 'orderProducts'));
//                 batch.set(productRef, {
//                     orderId: orderRef.id,
//                     nbsOrderId: order.nbsOrderId,
//                     productId: mappedProduct.id,
//                     productName: orderProduct.productName,
//                     quantityOrWeight: orderProduct.quantityOrWeight,
//                     weights: orderProduct.weights,
//                     price: orderProduct.price,
//                     createdAt: Timestamp.now(),
//                     createdBy: userId || "system",
//                     importId: newDoc.id,
//                 });
//                 totalProductsAdded++;
//                 currentBatchOperations += 1;
//             });

//             if (thisOrderProducts.length > mappedProducts.length) {
//                 console.log(`⚠️ Order ${order.nbsOrderId}: ${thisOrderProducts.length - mappedProducts.length} products not found in mapping`);
//             }

//             console.log(`📦 Prepared order ${order.nbsOrderId} with ${mappedProducts.length} products (${operationsForThisOrder} operations)`);
//         }

//         // Commit final batch if it has any operations
//         if (currentBatchOperations > 0) {
//             await batch.commit();
//             totalNewOrders += newOrders.length;
//             console.log(`✅ Final batch ${currentBatchIndex} committed with ${newOrders.length} orders and ${currentBatchOperations} total operations`);
//         }

//         console.log(`✅ Orders refreshed successfully. Total new orders: ${totalNewOrders}, Total products added: ${totalProductsAdded}`);
//         await updateDoc(doc(db, 'importOrders', newDoc.id), {
//             status: 'completed',
//             message: `Orders refreshed successfully (${MAX_ORDERS_TO_PROCESS} orders limit). Total new orders: ${totalNewOrders}, Total products added: ${totalProductsAdded}`,
//             totalNewOrders: totalNewOrders,
//             totalProductsAdded: totalProductsAdded,
//             maxOrdersLimit: MAX_ORDERS_TO_PROCESS,
//             complitedAt: Timestamp.now()
//         });
//         return totalNewOrders;
//     } catch (error) {
//         console.error('💥 Error refreshing orders:', error.message);
//         await updateDoc(doc(db, 'importOrders', newDoc.id), {
//             status: 'failed',
//             message: `Error refreshing orders: ${error.message}`,
//             complitedAt: Timestamp.now()
//         });
//         throw error;
//     }
// };

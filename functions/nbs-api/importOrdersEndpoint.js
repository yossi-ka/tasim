const { db } = require('../firebase-config');
const { Timestamp } = require("firebase-admin/firestore");

/**
 * אנדפוינט לייבוא הזמנות עם מוצרים מ-JSON
 * מקבל מערך של הזמנות עם מוצרים ושומר אותם ל-Firebase
 * 
 * @param {Array} ordersWithProducts - מערך של הזמנות עם מוצרים
 * @param {string} userId - מזהה המשתמש שמבצע את הייבוא (אופציונלי)
 * @returns {Object} תוצאות הייבוא
 */
const importOrdersFromJson = async (ordersWithProducts, userId = "system") => {
    console.log('🚀 Starting orders import from JSON...');

    if (!ordersWithProducts || !Array.isArray(ordersWithProducts)) {
        throw new Error('Invalid input: ordersWithProducts must be an array');
    }

    // יצירת רשומה ב-importOrders
    const importDoc = db.collection('importOrders').doc();
    await importDoc.set({
        createdAt: Timestamp.now(),
        complitedAt: null,
        status: 'started',
        message: `Starting import of ${ordersWithProducts.length} orders from JSON...`,
        totalOrders: ordersWithProducts.length,
        importType: 'json'
    });

    try {
        // חילוץ מספרי הזמנה לבדיקה
        const orderIds = ordersWithProducts
            .map(order => order.nbsOrderId)
            .filter(id => id && !isNaN(id));

        if (orderIds.length === 0) {
            await importDoc.update({
                status: 'failed',
                message: 'No valid order IDs found in input data',
                complitedAt: Timestamp.now()
            });
            throw new Error('No valid order IDs found in input data');
        }

        // מציאת מינימום ומקסימום של מספרי הזמנה
        const minOrderId = Math.min(...orderIds);
        const maxOrderId = Math.max(...orderIds);

        console.log(`📊 Order ID range: ${minOrderId} - ${maxOrderId} (Total: ${orderIds.length} orders)`);

        // שליפת הזמנות קיימות בטווח
        console.log('🔍 Fetching existing orders from Firebase...');
        const existingOrdersSnapshot = await db.collection('orders')
            .where('nbsOrderId', '>=', minOrderId)
            .where('nbsOrderId', '<=', maxOrderId)
            .get();

        // יצירת Map של מספרי הזמנות קיימות לבדיקה מהירה
        const existingOrderIds = new Map();
        existingOrdersSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.nbsOrderId) {
                existingOrderIds.set(data.nbsOrderId, {
                    id: doc.id, // חשוב! שמירת ה-document ID
                    ...data
                });
            }
        });

        console.log(`📋 Found ${existingOrderIds.size} existing orders in Firebase`);

        // טעינת מיפוי מוצרים
        console.log('🔄 Loading product mapping...');
        const productMapping = await loadProductMapping();

        const customerMapping = await loadCustomerMapping();

        // טעינת מיפוי מסלולים
        console.log('🔄 Loading route orders mapping...');
        const routeMapping = await loadRouteMapping();

        // הגדרות batch
        const BATCH_SIZE = 500;
        let currentBatchOperations = 0;
        let batch = db.batch();
        let totalNewOrders = 0;
        let totalProductsAdded = 0;
        let totalOrdersUpdated = 0;
        let totalSkippedOrders = 0;
        let currentBatchIndex = 1;

        console.log('🔄 Processing orders...');

        for (let i = 0; i < ordersWithProducts.length; i++) {
            const order = ordersWithProducts[i];

            // בדיקה אם ההזמנה כבר קיימת ללא שינויים ב-Map
            if (existingOrderIds.has(order.nbsOrderId)) {
                if(order.nbsSaleName === 'כלל המוצרים') {
                    totalSkippedOrders++;
                    continue;
                } else if (order.nbsSaleName === 'בשר עופות דגים') {
                    if(order.nbsOrderStatus ==="מאושרת") {
                        totalSkippedOrders++;
                        continue;
                    } else if (order.nbsOrderStatus ==="שולמה") {
                        // בדיקת הסטטוס של ההזמנה הקיימת ב-Map
                        const existingOrder = existingOrderIds.get(order.nbsOrderId);
                        if (existingOrder && existingOrder.nbsOrderStatus === "שולמה") {
                            totalSkippedOrders++;
                            continue;
                        } else if (existingOrder && existingOrder.nbsOrderStatus === "מאושרת") {
                            // עדכון ההזמנה הקיימת עם נתונים חדשים
                            const existingOrderRef = db.collection('orders').doc(existingOrder.id);
                            const updateData = {
                                nbsOrderStatus: order.nbsOrderStatus, // עדכון הסטטוס
                                totalPrice: order.totalPrice, // עדכון המחיר
                                updateBy: userId,
                                updateDate: Timestamp.now()
                            };
                            
                            batch.update(existingOrderRef, updateData);

                            // עדכון המוצרים של ההזמנה הקיימת
                            const existingOrderProductsRef = await db.collection('orderProducts').where('orderId', '==', existingOrder.id);
                            const existingOrderProductsSnapshot = await existingOrderProductsRef.get();
                            existingOrderProductsSnapshot.forEach(doc => {
                                const data = doc.data();
                                batch.update(doc.ref, {
                                    quantityOrWeight: order.products.find(p => p.nbsProductId === data.nbsProductId)?.quantityOrWeight || data.quantityOrWeight,
                                    price: order.products.find(p => p.nbsProductId === data.nbsProductId)?.price || data.price,
                                    weights: order.products.find(p => p.nbsProductId === data.nbsProductId)?.weights || data.weights
                                });
                            });

                            currentBatchOperations++;
                            totalOrdersUpdated++;
                            continue;
                        }     
                    }
                }
            }

            // סינון מוצרים קיימים במיפוי
            const validProducts = (order.products || []).filter(product =>
                product.nbsProductId && productMapping.has(product.nbsProductId)
            );

            const skippedProducts = (order.products || []).length - validProducts.length;
            if (skippedProducts > 0) {
                console.log(`⚠️ Order ${order.nbsOrderId}: ${skippedProducts} products not found in mapping`);
            }

            // חישוב מספר פעולות (1 הזמנה + מספר מוצרים)
            const operationsForThisOrder = 1 + validProducts.length;

            console.log("----test----")
            // טיפול בהזמנות עם יותר מ-BATCH_SIZE מוצרים
            if (operationsForThisOrder > BATCH_SIZE) {
                console.log(`⚠️ Order ${order.nbsOrderId} has ${validProducts.length} products (>${BATCH_SIZE}), processing in dedicated batch`);

                // שליחת batch נוכחי אם יש פעולות
                if (currentBatchOperations > 0) {
                    await batch.commit();
                    console.log(`✅ Batch ${currentBatchIndex} committed with ${currentBatchOperations} operations`);
                    currentBatchIndex++;
                }

                // יצירת batch נפרד להזמנה הגדולה
                const largeBatch = db.batch();

                // הוספת ההזמנה
                const orderRef = db.collection('orders').doc();
                const mappedCustomer = customerMapping.get(order.nbsCustomerId) || null;
                
                // חישוב deliveryIndex מטבלת המסלולים
                let deliveryIndex = 0;
                if (mappedCustomer && mappedCustomer.street && mappedCustomer.houseNumber) {
                    const routeKey = `${mappedCustomer.street}-${mappedCustomer.houseNumber}`;
                    const routeOrder = routeMapping.get(routeKey);
                    if (routeOrder) {
                        deliveryIndex = routeOrder.orderNumber;
                    }
                }
                
                const orderData = createOrderData(order, userId, importDoc.id, mappedCustomer, deliveryIndex);
                largeBatch.set(orderRef, orderData);

                // הוספת כל המוצרים
                validProducts.forEach(product => {
                    const mappedProduct = productMapping.get(product.nbsProductId);
                    const productRef = db.collection('orderProducts').doc();
                    const productData = createOrderProductData(
                        orderRef.id,
                        order.nbsOrderId,
                        product,
                        mappedProduct,
                        userId,
                        importDoc.id,
                        mappedCustomer
                    );
                    largeBatch.set(productRef, productData);
                    totalProductsAdded++;
                });

                // שליחת batch הגדול
                await largeBatch.commit();
                totalNewOrders++;
                console.log(`✅ Large order batch ${currentBatchIndex} committed with 1 order and ${operationsForThisOrder} operations`);
                currentBatchIndex++;

                // איפוס batch רגיל
                batch = db.batch();
                currentBatchOperations = 0;
                continue;
            }

            // בדיקה אם הוספת ההזמנה תעבור את גבול ה-batch
            if (currentBatchOperations + operationsForThisOrder > BATCH_SIZE && currentBatchOperations > 0) {
                await batch.commit();
                console.log(`✅ Batch ${currentBatchIndex} committed with ${currentBatchOperations} operations`);
                currentBatchIndex++;

                // התחלת batch חדש
                batch = db.batch();
                currentBatchOperations = 0;
            }

            // הוספת ההזמנה ל-batch
            const orderRef = db.collection('orders').doc();
            const mappedCustomer = customerMapping.get(order.nbsCustomerId) || null;
            
            // חישוב deliveryIndex מטבלת המסלולים
            let deliveryIndex = 0;
            if (mappedCustomer && mappedCustomer.street && mappedCustomer.houseNumber) {
                const routeKey = `${mappedCustomer.street}-${mappedCustomer.houseNumber}`;
                const routeOrder = routeMapping.get(routeKey);
                if (routeOrder) {
                    deliveryIndex = routeOrder.orderNumber;
                }
            }
            
            console.log("----test----")
            console.log("----test---- customer in order: " + order.nbsOrderId + "----" + order.nbsCustomerId, mappedCustomer, "deliveryIndex:", deliveryIndex);
            const orderData = createOrderData(order, userId, importDoc.id, mappedCustomer, deliveryIndex);
            batch.set(orderRef, orderData);
            currentBatchOperations++;
            totalNewOrders++;

            // הוספת המוצרים ל-batch
            validProducts.forEach(product => {
                const mappedProduct = productMapping.get(product.nbsProductId);
                const productRef = db.collection('orderProducts').doc();
                const productData = createOrderProductData(
                    orderRef.id,
                    order.nbsOrderId,
                    product,
                    mappedProduct,
                    userId,
                    importDoc.id
                );
                batch.set(productRef, productData);
                currentBatchOperations++;
                totalProductsAdded++;
            });

            // הדפסת התקדמות
            if (i % 100 === 0) {
                console.log(`📦 Processed ${i}/${ordersWithProducts.length} orders`);
            }
        }

        // שליחת batch אחרון אם יש פעולות
        if (currentBatchOperations > 0) {
            await batch.commit();
            console.log(`✅ Final batch ${currentBatchIndex} committed with ${currentBatchOperations} operations`);
        }

        // עדכון רשומת הייבוא
        const successMessage = `Import completed successfully. New orders: ${totalNewOrders}, Products added: ${totalProductsAdded}, Updated orders: ${totalOrdersUpdated}, Skipped orders: ${totalSkippedOrders}`;

        await importDoc.update({
            status: 'completed',
            message: successMessage,
            totalNewOrders: totalNewOrders,
            totalProductsAdded: totalProductsAdded,
            totalSkippedOrders: totalSkippedOrders,
            totalOrdersUpdated: totalOrdersUpdated,
            complitedAt: Timestamp.now()
        });

        console.log(`✅ ${successMessage}`);

        return {
            success: true,
            totalNewOrders,
            totalProductsAdded,
            totalSkippedOrders,
            importId: importDoc.id
        };

    } catch (error) {
        console.error('💥 Error during import:', error.message);

        await importDoc.update({
            status: 'failed',
            message: `Import failed: ${error.message}`,
            complitedAt: Timestamp.now()
        });

        throw error;
    }
};

/**
 * יצירת אובייקט הזמנה לשמירה ב-Firebase
 */
const createOrderData = (order, userId, importId, mappedCustomer, deliveryIndex = 0) => {
    const { products, ...orderWithoutProducts } = order; // הסרת מערך המוצרים
    console.log('customer in order: ' + order.nbsOrderId, mappedCustomer);
    return {
        ...orderWithoutProducts,
        orderStatus: 1,
        createdBy: userId,
        createdDate: Timestamp.now(),
        updateBy: userId,
        updateDate: Timestamp.now(),
        isActive: true,
        importId: importId,
        customerId: mappedCustomer ? mappedCustomer.id : null,
        deliveryIndex: deliveryIndex, // משתמש בערך המחושב מטבלת המסלולים
        // המרת תאריכים אם הם מגיעים כ-string
        openedAt: order.openedAt ? (typeof order.openedAt === 'string' ? new Date(order.openedAt) : order.openedAt) : null,
        closedAt: order.closedAt ? (typeof order.closedAt === 'string' ? new Date(order.closedAt) : order.closedAt) : null
    };
};

/**
 * יצירת אובייקט מוצר הזמנה לשמירה ב-Firebase
 */
const createOrderProductData = (orderId, nbsOrderId, product, mappedProduct, userId, importId) => {
    return {
        orderId: orderId,
        nbsOrderId: nbsOrderId,
        productId: mappedProduct.id,
        productName: product.productName,
        quantityOrWeight: product.quantityOrWeight || 0,
        // weights: product.weights || null,
        price: product.price || 0,
        createdAt: Timestamp.now(),
        createdBy: userId,
        importId: importId,

    };
};

/**
 * טעינת מיפוי מוצרים לחיפוש מהיר
 */
const loadProductMapping = async () => {
    try {
        console.log('🔄 Loading product mapping...');
        const productsSnapshot = await db.collection('products')
            .select('nbsProductId')
            .get();

        const productMapping = new Map();
        productsSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.nbsProductId) {
                productMapping.set(data.nbsProductId, {
                    id: doc.id,
                    nbsProductId: data.nbsProductId
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

const loadCustomerMapping = async () => {
    try {
        console.log('🔄 Loading customer mapping...');
        const customersSnapshot = await db.collection('customers')
            .select('customerNumber', 'street', 'houseNumber') // הוספת street ו-houseNumber
            .get();

        const customerMapping = new Map();
        customersSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.customerNumber) {
                customerMapping.set(data.customerNumber, {
                    id: doc.id,
                    customerNumber: data.customerNumber,
                    street: data.street || null,
                    houseNumber: data.houseNumber || null
                });
            }
        });

        console.log(`📋 Loaded ${customerMapping.size} customers for mapping`);
        return customerMapping;
    } catch (error) {
        console.error('💥 Error loading customer mapping:', error.message);
        throw error;
    }
};

const loadRouteMapping = async () => {
    try {
        console.log('🔄 Loading route orders mapping...');
        const routeOrdersSnapshot = await db.collection('routeOrders')
            .where('isActive', '==', true)
            .select('street', 'buildingNumber', 'orderNumber')
            .get();

        const routeMapping = new Map();
        routeOrdersSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.street && data.buildingNumber && data.orderNumber !== undefined) {
                const key = `${data.street}-${data.buildingNumber}`;
                routeMapping.set(key, {
                    street: data.street,
                    buildingNumber: data.buildingNumber,
                    orderNumber: data.orderNumber
                });
            }
        });

        console.log(`📋 Loaded ${routeMapping.size} route orders for mapping`);
        return routeMapping;
    } catch (error) {
        console.error('💥 Error loading route orders mapping:', error.message);
        throw error;
    }
};

const getLastOrderImportDate = async () => {
    const importDoc = await db.collection('importOrders').orderBy('createdAt', 'desc').limit(1).get();
    if (!importDoc.empty) {
        const lastImport = importDoc.docs[0];
        return lastImport.data().createdAt.toDate().toISOString();
    }
    return null;
};

module.exports = {
    importOrdersFromJson,
    getLastOrderImportDate
};

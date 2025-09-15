import { db } from '../../firebase-config'

import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, Timestamp, updateDoc, where, writeBatch, getCountFromServer, limit } from "firebase/firestore";

export const getOrdersByStatus = async (status) => {
    console.log('Fetching orders with status:', status);
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, status ? where("orderStatus", "==", status) : null, orderBy("updateDate", "desc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {

        const [phone1 = "", phone2 = "", phone3 = ""] = doc.data().phones || [];
        return {
            id: doc.id,
            ...doc.data(),
            phone1,
            phone2,
            phone3
        }
    });
}

export const getOrderById = async (id) => {
    const docRef = doc(db, 'orders', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    } else {
        throw new Error("No such document!");
    }
}

export const addOrder = async (data, userId) => {
    const docRef = await addDoc(collection(db, 'orders'), {
        ...data,
        createdBy: userId,
        createdDate: Timestamp.now(),
        updateBy: userId,
        updateDate: Timestamp.now(),
        isActive: true,
    });

    return { id: docRef.id, ...data }
}

export const updateOrder = async (id, data, userId) => {
    const docRef = doc(db, 'orders', id);

    await updateDoc(docRef, {
        ...data,
        updateBy: userId,
        updateDate: Timestamp.now(),
    });
    return { id, ...data }
}

export const uploadOrders = async (ordersData, userId) => {
    const ordersCollection = collection(db, 'orders');
    const FIRESTORE_BATCH_SIZE = 500; // מגבלת Firestore לbatch writes

    try {
        // קריאה אחת לקבלת כל מספרי ההזמנות הקיימים
        console.log('Fetching existing order IDs...');
        const existingOrdersQuery = query(ordersCollection);
        const existingOrdersSnapshot = await getDocs(existingOrdersQuery);

        // יצירת Set של מספרי הזמנות קיימים לבדיקה מהירה
        const existingOrderIds = new Set();
        existingOrdersSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.nbsOrderId) {
                existingOrderIds.add(data.nbsOrderId);
            }
        });

        console.log(`Found ${existingOrderIds.size} existing orders`);

        // סינון ההזמנות - רק אלה שלא קיימות
        const newOrders = [];
        const skippedOrders = [];

        for (const orderData of ordersData) {
            const { nbsOrderId } = orderData;

            if (!nbsOrderId) {
                console.warn('Order without nbsOrderId, skipping:', orderData);
                continue;
            }

            if (existingOrderIds.has(nbsOrderId)) {
                // ההזמנה כבר קיימת - דילוג
                skippedOrders.push(nbsOrderId);
                console.log(`Order ${nbsOrderId} already exists, skipping`);
            } else {
                // הזמנה חדשה
                newOrders.push(orderData);
            }
        }

        console.log(`Processing ${newOrders.length} new orders, skipping ${skippedOrders.length} existing orders`);

        // העלאה של ההזמנות החדשות בbatches של Firestore
        const uploadedOrders = [];
        for (let i = 0; i < newOrders.length; i += FIRESTORE_BATCH_SIZE) {
            const batch = writeBatch(db);
            const batchOrders = newOrders.slice(i, i + FIRESTORE_BATCH_SIZE);
            const batchResults = [];

            for (const orderData of batchOrders) {
                // יצירת מסמך חדש בקולקציה (עם ID אוטומטי)
                const newOrderRef = doc(ordersCollection);

                // הוספת המידע הנדרש
                const orderWithMetadata = {
                    ...orderData,
                    orderStatus: 1,
                    createdBy: userId,
                    createdDate: Timestamp.now(),
                    updateBy: userId,
                    updateDate: Timestamp.now(),
                    isActive: true,
                };

                batch.set(newOrderRef, orderWithMetadata);
                batchResults.push({ id: newOrderRef.id, ...orderWithMetadata });
            }

            // ביצוע הbatch הנוכחי
            if (batchResults.length > 0) {
                await batch.commit();
                uploadedOrders.push(...batchResults);
                console.log(`Uploaded batch ${Math.floor(i / FIRESTORE_BATCH_SIZE) + 1}: ${batchResults.length} orders`);
            }
        }

        return {
            success: true,
            totalProcessed: ordersData.length,
            newOrdersCount: uploadedOrders.length,
            skippedCount: skippedOrders.length,
            newOrders: uploadedOrders,
            skippedOrderIds: skippedOrders
        };

    } catch (error) {
        console.error('Error uploading orders:', error);
        throw new Error(`שגיאה בהעלאת ההזמנות: ${error.message}`);
    }
}

export const getSummaryByStatus = async () => {
    const ordersRef = collection(db, "orders");

    // יצירת queries לכל סטטוס במקביל
    const countPromises = [
        getCountFromServer(query(ordersRef)), // כל ההזמנות
        getCountFromServer(query(ordersRef, where("orderStatus", "==", 1))), // start
        getCountFromServer(query(ordersRef, where("orderStatus", "==", 2))), // likut
        getCountFromServer(query(ordersRef, where("orderStatus", "==", 3))), // mamtinLemishloach
        getCountFromServer(query(ordersRef, where("orderStatus", "==", 4))), // mishloach
        getCountFromServer(query(ordersRef, where("orderStatus", "==", 5))), // end
        getCountFromServer(query(ordersRef, where("orderStatus", "==", 6))), // kvitzat likut
        getCountFromServer(query(ordersRef, where("orderStatus", "==", 7)))  // kfuim-start
    ];

    try {
        const results = await Promise.all(countPromises);

        const summary = {
            all: results[0].data().count,
            start: results[1].data().count,
            likut: results[2].data().count,
            mamtinLemishloach: results[3].data().count,
            mishloach: results[4].data().count,
            end: results[5].data().count,
            kvitzatLikut: results[6].data().count,
            kfuimStart: results[7].data().count
        };

        return summary;
    } catch (error) {
        console.error('Error getting summary by status:', error);
        throw new Error(`שגיאה בקבלת סיכום לפי סטטוס: ${error.message}`);
    }
}

export const changeOrdersStatus = async (ids, data, userId) => {
    if (!Array.isArray(ids) || ids.length === 0) {
        throw new Error("ids must be a non-empty array");
    }

    const FIRESTORE_BATCH_SIZE = 500;
    const updatedOrders = [];
    // קבלת weeklyId הגבוה ביותר של השבוע הנוכחי
    // נחפש את כל המסמכים שיש להם weeklyId ונוצרו/עודכנו השבוע (updateStatus בשבוע הנוכחי)
    // ואז נמצא את הערך המקסימלי כדי שנוכל להקצות max+1
    let weeklyIdCounterStart = 0;
    try {
        // חשב התחלת השבוע (יום ראשון 00:00) לפי זמן מקומי/UTC כפי שמתועד ב-Timestamp
        const now = new Date();
        const day = now.getDay(); // 0 = Sunday
        // חישוב תאריך יום ראשון של השבוע הנוכחי
        const diffToSunday = day; // days since Sunday
        const sunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToSunday);
        sunday.setHours(0, 0, 0, 0);

        // שאילתה: כל ההזמנות שיש להן weeklyId וש- updateStatus >= תחילת השבוע
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef,
            where('weeklyId', '!=', null),
            where('updateStatus', '>=', Timestamp.fromDate(sunday)));
        const snapshot = await getDocs(q);
        let maxWeekly = 0;
        snapshot.forEach(d => {
            const w = d.data().weeklyId;
            const n = typeof w === 'number' ? w : parseInt(w, 10);
            if (!Number.isNaN(n) && n > maxWeekly) maxWeekly = n;
        });
        weeklyIdCounterStart = maxWeekly;
    } catch (err) {
        console.error('Error computing weeklyId max:', err);
        // לא נזרוק שגיאה כי נשמור על עבודה רגילה בלי weeklyId
        weeklyIdCounterStart = 0;
    }

    // נשתמש במונה מקומי כדי להקצות weeklyId ייחודי לכל מסמך שצריך
    let weeklyCounter = weeklyIdCounterStart;

    for (let i = 0; i < ids.length; i += FIRESTORE_BATCH_SIZE) {
        const batch = writeBatch(db);
        const batchIds = ids.slice(i, i + FIRESTORE_BATCH_SIZE);
        let batchHasOps = false;

        for (const id of batchIds) {
            const docRef = doc(db, 'orders', id);
            const orderDoc = await getDoc(docRef);
            if (!orderDoc.exists()) {
                console.warn(`Order ${id} not found, skipping`);
                continue;
            }

            const orderData = orderDoc.data();

            const objToUpdate = {
                ...data,
                updateBy: userId,
                // הערכים של תאריכים
                updateDate: Timestamp.now(),
                updateStatus: Timestamp.now(),
            };

            // תנאים להוספת weeklyId:
            // - סטטוס קודם היה 1
            // - סטטוס חדש (data.orderStatus) הוא 2
            // - במסמך עדיין אין weeklyId
            try {
                const prevStatus = orderData.orderStatus;
                const newStatus = data.orderStatus;
                const hasWeekly = orderData.weeklyId !== undefined && orderData.weeklyId !== null;

                if (prevStatus === 1 && newStatus === 2 && !hasWeekly) {
                    weeklyCounter += 1;
                    objToUpdate.weeklyId = weeklyCounter;
                }
            } catch (e) {
                // במקרה של בעיה בקריאת נתוני המסמך, רק נמשיך בלי weekly
                console.warn('Error checking weeklyId conditions for order', id, e);
            }

            batch.update(docRef, objToUpdate);
            batchHasOps = true;
            updatedOrders.push(id);
        }

        if (batchHasOps) {
            await batch.commit();
        }
    }

    return { updatedOrderIds: updatedOrders, ...data };
}

export const getLatestImportStatus = async () => {
    try {
        const importOrdersRef = collection(db, "importOrders");
        const q = query(importOrdersRef, orderBy("createdAt", "desc"), limit(1));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            return null;
        }

        const doc = querySnapshot.docs[0];
        const data = doc.data();

        // המרת Timestamp לתאריך רגיל
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            complitedAt: data.complitedAt?.toDate()
        };
    } catch (error) {
        console.error('Error fetching latest import status:', error);
        throw error;
    }
}

export const syncOrderNumbers = async (userId) => {
    try {
        console.log('🚀 Starting order numbers sync...');

        // 1. שליפת הזמנות בסטטוס 1
        console.log('🔍 Fetching orders with status 1...');
        const ordersRef = collection(db, "orders");
        const ordersQuery = query(ordersRef, where("orderStatus", "==", 1));
        const ordersSnapshot = await getDocs(ordersQuery);

        if (ordersSnapshot.empty) {
            return {
                success: true,
                message: 'לא נמצאו הזמנות בסטטוס 1 לסנכרון',
                updatedCount: 0
            };
        }

        console.log(`📋 Found ${ordersSnapshot.size} orders with status 1`);

        // 2. טעינת מיפוי לקוחות (לפי nbsCustomerId)
        console.log('🔄 Loading customer mapping...');
        const customersRef = collection(db, "customers");
        const customersSnapshot = await getDocs(customersRef);

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

        // 3. טעינת מיפוי מסלולים (רשימה עם סדר כתובות)
        console.log('🔄 Loading route orders mapping...');
        const routeOrdersRef = collection(db, "routeOrders");
        const routeOrdersQuery = query(routeOrdersRef, where("isActive", "==", true));
        const routeOrdersSnapshot = await getDocs(routeOrdersQuery);

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

        // 4. עדכון deliveryIndex להזמנות
        const BATCH_SIZE = 500;
        let currentBatch = writeBatch(db);
        let batchOperations = 0;
        let totalUpdated = 0;
        let totalSkipped = 0;

        console.log('🔄 Processing orders for delivery index update...');

        for (const orderDoc of ordersSnapshot.docs) {
            const orderData = orderDoc.data();
            const nbsCustomerId = orderData.nbsCustomerId;

            if (!nbsCustomerId) {
                console.log(`⚠️ Order ${orderData.nbsOrderId} has no nbsCustomerId, skipping`);
                totalSkipped++;
                continue;
            }

            // מציאת הלקוח לפי nbsCustomerId
            const mappedCustomer = customerMapping.get(nbsCustomerId);
            if (!mappedCustomer) {
                console.log(`⚠️ Customer ${nbsCustomerId} not found for order ${orderData.nbsOrderId}, skipping`);
                totalSkipped++;
                continue;
            }

            // חישוב deliveryIndex מטבלת המסלולים
            let newDeliveryIndex = 0;
            if (mappedCustomer.street && mappedCustomer.houseNumber) {
                const routeKey = `${mappedCustomer.street}-${mappedCustomer.houseNumber}`;
                const routeOrder = routeMapping.get(routeKey);
                if (routeOrder) {
                    newDeliveryIndex = routeOrder.orderNumber;
                }
            }

            // בדיקה אם יש צורך בעדכון
            const currentDeliveryIndex = orderData.deliveryIndex || 0;
            if (currentDeliveryIndex === newDeliveryIndex) {
                continue; // אין צורך בעדכון
            }

            console.log(`📦 Updating order ${orderData.nbsOrderId}: deliveryIndex ${currentDeliveryIndex} -> ${newDeliveryIndex}`);

            // הוספה לbatch
            const orderRef = doc(db, 'orders', orderDoc.id);
            currentBatch.update(orderRef, {
                deliveryIndex: newDeliveryIndex,
                updateBy: userId,
                updateDate: Timestamp.now()
            });

            batchOperations++;
            totalUpdated++;

            // שליחת batch כשמגיעים לגבול
            if (batchOperations >= BATCH_SIZE) {
                await currentBatch.commit();
                console.log(`✅ Batch committed with ${batchOperations} operations`);
                currentBatch = writeBatch(db);
                batchOperations = 0;
            }
        }

        // שליחת batch אחרון אם יש פעולות
        if (batchOperations > 0) {
            await currentBatch.commit();
            console.log(`✅ Final batch committed with ${batchOperations} operations`);
        }

        const message = `סנכרון מספרים הושלם בהצלחה. עודכנו: ${totalUpdated} הזמנות, דולגו: ${totalSkipped} הזמנות`;
        console.log(`✅ ${message}`);

        return {
            success: true,
            message,
            updatedCount: totalUpdated,
            skippedCount: totalSkipped
        };

    } catch (error) {
        console.error('💥 Error syncing order numbers:', error);
        throw new Error(`שגיאה בסנכרון מספרים: ${error.message}`);
    }
}

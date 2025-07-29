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
        getCountFromServer(query(ordersRef, where("orderStatus", "==", 6)))  // kvitzat likut
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
            kvitzatLikut: results[6].data().count
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

    for (let i = 0; i < ids.length; i += FIRESTORE_BATCH_SIZE) {
        const batch = writeBatch(db);
        const batchIds = ids.slice(i, i + FIRESTORE_BATCH_SIZE);

        for (const id of batchIds) {
            const docRef = doc(db, 'orders', id);
            const orderDoc = await getDoc(docRef);
            if (!orderDoc.exists()) {
                // אפשר לדלג או לזרוק שגיאה, כאן נדלג
                console.warn(`Order ${id} not found, skipping`);
                continue;
            }

            batch.update(docRef, {
                ...data,
                updateBy: userId,
                updateDate: Timestamp.now(),
                updateStatus: Timestamp.now(),
            });

            // const orderStatusesRef = collection(db, 'orderStatuses');
            // const newStatusDoc = doc(orderStatusesRef);
            // batch.set(newStatusDoc, {
            //     ...data,
            //     orderId: id,
            //     updateBy: userId,
            //     updateDate: Timestamp.now(),
            // });

            updatedOrders.push(id);
        }

        if (updatedOrders.length > 0) {
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

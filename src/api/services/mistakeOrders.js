import { db } from '../../firebase-config'
import {
    addDoc,
    collection,
    doc,
    getDoc,
    getDocs,
    orderBy,
    query,
    where,
    Timestamp,
    updateDoc,
    writeBatch
} from "firebase/firestore";

// ========================================
// פונקציות עבור טעויות בהזמנות (Mistake Orders)
// ========================================

/**
 * קבלת כל הפניות לטעויות בהזמנות
 */
export const getAllMistakeOrders = async () => {
    try {
        const mistakeOrdersRef = collection(db, "mistakeOrders");
        const q = query(
            mistakeOrdersRef,
            where("isActive", "==", true),
            orderBy("createdDate", "desc")
        );
        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return [];
        }

        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching mistake orders:', error);
        // Return empty array instead of throwing error
        return [];
    }
}

/**
 * קבלת פניה ספציפית לפי ID
 */
export const getMistakeOrderById = async (id) => {
    const docRef = doc(db, 'mistakeOrders', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    } else {
        throw new Error("No such document!");
    }
}

/**
 * הוספת פניה חדשה לטעות בהזמנה
 */
export const addMistakeOrder = async (data, userId) => {
    // וודא שהסטטוס נשמר כמספר
    const processedData = { ...data };
    if (processedData.status !== undefined) {
        processedData.status = Number(processedData.status);
    }
    
    const docRef = await addDoc(collection(db, 'mistakeOrders'), {
        ...processedData,
        status: 1, // סטטוס ראשוני - חדש (תמיד 1)
        createdBy: userId,
        createdDate: Timestamp.now(),
        updateBy: userId,
        updateDate: Timestamp.now(),
        isActive: true,
    });

    return { id: docRef.id, ...data };
}

/**
 * עדכון פניה קיימת
 */
export const updateMistakeOrder = async (id, data, userId) => {
    const docRef = doc(db, 'mistakeOrders', id);
    
    // וודא שהסטטוס נשמר כמספר
    const updateData = { ...data };
    if (updateData.status !== undefined) {
        updateData.status = Number(updateData.status);
    }
    
    await updateDoc(docRef, {
        ...updateData,
        updateBy: userId,
        updateDate: Timestamp.now(),
    });
    return { id, ...updateData };
}

/**
 * עדכון סטטוס פניה
 */
export const updateMistakeOrderStatus = async (id, status, userId) => {
    // וודא שהסטטוס הוא מספר חוקי
    const statusNum = typeof status === 'string' ? parseInt(status) : status;
    
    if (![1, 2, 3].includes(statusNum)) {
        throw new Error('סטטוס לא חוקי. חייב להיות 1, 2 או 3');
    }

    const docRef = doc(db, 'mistakeOrders', id);
    const updateData = {
        status: statusNum,
        updateBy: userId,
        updateDate: Timestamp.now(),
    };
    
    // אם הסטטוס הוא סגור (3), שנה גם את isActive
    if (statusNum === 3) {
        updateData.isActive = false;
    }
    
    await updateDoc(docRef, updateData);
    return true;
}

/**
 * סגירת פניה (שינוי isActive לfalse)
 */
export const closeMistakeOrder = async (id, userId) => {
    const docRef = doc(db, 'mistakeOrders', id);
    await updateDoc(docRef, {
        isActive: false,
        status: 3, // סגור (מספר)
        updateBy: userId,
        updateDate: Timestamp.now(),
    });
    return true;
}

/**
 * איתור הזמנה לפי מספר הזמנה NBS
 */
export const findOrderByNbsOrderId = async (nbsOrderId) => {
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, where("nbsOrderId", "==", parseInt(nbsOrderId)));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        return null;
    }

    // החזר את ההזמנה הראשונה שנמצאה
    const orderDoc = querySnapshot.docs[0];
    const orderData = { id: orderDoc.id, ...orderDoc.data() };

    // הבאת פריטי ההזמנה
    try {
        const orderProductsRef = collection(db, "orderProducts");
        const productsQuery = query(orderProductsRef, where("orderId", "==", orderData.id));
        const productsSnapshot = await getDocs(productsQuery);

        const orderItems = productsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        orderData.items = orderItems;
    } catch (error) {
        console.error('Error fetching order items:', error);
        orderData.items = [];
    }

    return orderData;
}

// ========================================
// פונקציות עבור סוגי טעויות (Mistake Order Types)
// ========================================

/**
 * קבלת כל סוגי הטעויות
 */
export const getAllMistakeOrderTypes = async () => {
    try {
        console.log('Fetching all mistake order types');
        const typesRef = collection(db, "mistakeOrderType");
        const q = query(typesRef, orderBy("name", "asc"));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
        console.error('Error fetching mistake order types:', error);
        // Return empty array instead of throwing error
        return [];
    }
}

/**
 * הוספת סוג טעות חדש
 */
export const addMistakeOrderType = async (data, userId) => {
    const docRef = await addDoc(collection(db, 'mistakeOrderType'), {
        ...data,
        createdBy: userId,
        createdDate: Timestamp.now(),
        updateBy: userId,
        updateDate: Timestamp.now(),
        isActive: true,
    });

    return { id: docRef.id, ...data };
}

/**
 * עדכון סוג טעות קיים
 */
export const updateMistakeOrderType = async (id, data, userId) => {
    const docRef = doc(db, 'mistakeOrderType', id);
    await updateDoc(docRef, {
        ...data,
        updateBy: userId,
        updateDate: Timestamp.now(),
    });
    return { id, ...data };
}
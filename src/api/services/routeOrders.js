import { 
    collection, 
    query, 
    orderBy, 
    getDocs, 
    doc, 
    getDoc, 
    addDoc, 
    updateDoc, 
    deleteDoc,
    Timestamp,
    where,
    getCountFromServer,
    writeBatch
} from "firebase/firestore";
import { db } from "../../firebase-config";

export const getAllRouteOrders = async () => {
    console.log('Fetching all route orders');
    const routeOrdersRef = collection(db, "routeOrders");
    const q = query(routeOrdersRef, orderBy("orderNumber", "asc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export const getRouteOrderById = async (id) => {
    const docRef = doc(db, 'routeOrders', id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    } else {
        throw new Error("No such document!");
    }
}

export const addRouteOrder = async (data, userId) => {
    const docRef = await addDoc(collection(db, 'routeOrders'), {
        ...data,
        createdBy: userId,
        createdDate: Timestamp.now(),
        updateBy: userId,
        updateDate: Timestamp.now(),
        isActive: true,
    });

    return { id: docRef.id, ...data }
}

export const updateRouteOrder = async (id, data, userId) => {
    const docRef = doc(db, 'routeOrders', id);

    await updateDoc(docRef, {
        ...data,
        updateBy: userId,
        updateDate: Timestamp.now(),
    });
    return { id, ...data }
}

export const deleteRouteOrder = async (id, userId) => {
    const docRef = doc(db, 'routeOrders', id);
    
    await updateDoc(docRef, {
        isActive: false,
        updateBy: userId,
        updateDate: Timestamp.now(),
    });
    
    return { id, isActive: false }
}

export const getRouteOrdersCount = async () => {
    const routeOrdersRef = collection(db, "routeOrders");
    const countQuery = query(routeOrdersRef, where("isActive", "==", true));
    
    try {
        const countSnapshot = await getCountFromServer(countQuery);
        return countSnapshot.data().count;
    } catch (error) {
        console.error('Error getting route orders count:', error);
        throw new Error(`שגיאה בקבלת מספר סדרי המסלולים: ${error.message}`);
    }
}

export const getRouteOrdersByStreet = async (street) => {
    const routeOrdersRef = collection(db, "routeOrders");
    const q = query(
        routeOrdersRef, 
        where("street", "==", street),
        where("isActive", "==", true),
        orderBy("buildingNumber", "asc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export const getActiveRouteOrders = async () => {
    const routeOrdersRef = collection(db, "routeOrders");
    const q = query(
        routeOrdersRef, 
        where("isActive", "==", true),
        orderBy("street", "asc"),
        orderBy("buildingNumber", "asc")
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export const uploadRouteOrders = async (routeOrdersData, userId) => {
    const routeOrdersCollection = collection(db, 'routeOrders');
    const FIRESTORE_BATCH_SIZE = 500; // מגבלת Firestore לbatch writes

    try {
        // קריאה אחת לקבלת כל סדרי המסלולים הקיימים
        console.log('Fetching existing route orders...');
        const existingRouteOrdersQuery = query(routeOrdersCollection);
        const existingRouteOrdersSnapshot = await getDocs(existingRouteOrdersQuery);

        // יצירת Set של מפתחות קיימים לבדיקה מהירה (רחוב + בנין)
        const existingRouteOrderKeys = new Set();
        existingRouteOrdersSnapshot.forEach(doc => {
            const data = doc.data();
            if (data.street && data.buildingNumber) {
                const key = `${data.street}-${data.buildingNumber}`;
                existingRouteOrderKeys.add(key);
            }
        });

        console.log(`Found ${existingRouteOrderKeys.size} existing route orders`);

        // סינון סדרי המסלולים - רק אלה שלא קיימים
        const newRouteOrders = [];
        const skippedRouteOrders = [];

        for (const routeOrderData of routeOrdersData) {
            const { street, buildingNumber, orderNumber } = routeOrderData;

            if (!street || !buildingNumber || !orderNumber) {
                console.warn('Route order without required fields, skipping:', routeOrderData);
                continue;
            }

            const key = `${street}-${buildingNumber}`;

            if (existingRouteOrderKeys.has(key)) {
                // סדר המסלול כבר קיים - דילוג
                skippedRouteOrders.push(key);
                console.log(`Route order ${key} already exists, skipping`);
            } else {
                // סדר מסלול חדש
                newRouteOrders.push(routeOrderData);
            }
        }

        console.log(`Processing ${newRouteOrders.length} new route orders, skipping ${skippedRouteOrders.length} existing route orders`);

        // העלאה של סדרי המסלולים החדשים בbatches של Firestore
        const uploadedRouteOrders = [];
        for (let i = 0; i < newRouteOrders.length; i += FIRESTORE_BATCH_SIZE) {
            const batch = writeBatch(db);
            const batchRouteOrders = newRouteOrders.slice(i, i + FIRESTORE_BATCH_SIZE);
            const batchResults = [];

            for (const routeOrderData of batchRouteOrders) {
                // יצירת מסמך חדש בקולקציה (עם ID אוטומטי)
                const newRouteOrderRef = doc(routeOrdersCollection);

                // הוספת המידע הנדרש
                const routeOrderWithMetadata = {
                    ...routeOrderData,
                    createdBy: userId,
                    createdDate: Timestamp.now(),
                    updateBy: userId,
                    updateDate: Timestamp.now(),
                    isActive: true,
                };

                batch.set(newRouteOrderRef, routeOrderWithMetadata);
                batchResults.push({ id: newRouteOrderRef.id, ...routeOrderWithMetadata });
            }

            // ביצוע הbatch הנוכחי
            if (batchResults.length > 0) {
                await batch.commit();
                uploadedRouteOrders.push(...batchResults);
            }
        }

        return {
            success: true,
            totalProcessed: routeOrdersData.length,
            newRouteOrdersCount: uploadedRouteOrders.length,
            skippedCount: skippedRouteOrders.length,
            newRouteOrders: uploadedRouteOrders,
            skippedRouteOrderKeys: skippedRouteOrders
        };

    } catch (error) {
        console.error('Error uploading route orders:', error);
        throw new Error(`שגיאה בהעלאת סדרי המסלולים: ${error.message}`);
    }
}

export const addSingleRouteOrder = async (routeOrderData, userId) => {
    const routeOrdersCollection = collection(db, 'routeOrders');
    
    try {
        const { street, buildingNumber, orderNumber } = routeOrderData;
        
        // שלב 1: מציאת כל הרשומות עם orderNumber >= מהמספר החדש באותו רחוב ובנין
        const existingOrdersQuery = query(
            routeOrdersCollection,
            where("orderNumber", ">=", orderNumber)
        );
        
        const existingOrdersSnapshot = await getDocs(existingOrdersQuery);
        
        // שלב 2: הכנת batch לעדכון כל הרשומות הקיימות
        const batch = writeBatch(db);
        const updates = [];
        
        existingOrdersSnapshot.forEach(doc => {
            const data = doc.data();
            const newOrderNumber = data.orderNumber + 1;
            
            batch.update(doc.ref, {
                orderNumber: newOrderNumber,
                updateBy: userId,
                updateDate: Timestamp.now()
            });
            
            updates.push({
                id: doc.id,
                oldOrderNumber: data.orderNumber,
                newOrderNumber: newOrderNumber
            });
        });
        
        // שלב 3: הוספת הרשומה החדשה
        const newRouteOrderRef = doc(routeOrdersCollection);
        const newRouteOrderData = {
            ...routeOrderData,
            createdBy: userId,
            createdDate: Timestamp.now(),
            updateBy: userId,
            updateDate: Timestamp.now(),
            isActive: true,
        };
        
        batch.set(newRouteOrderRef, newRouteOrderData);
        
        // ביצוע כל הפעולות בbatch אחד
        await batch.commit();
        
        console.log(`Added new route order and shifted ${updates.length} existing orders`);
        
        return {
            success: true,
            newRouteOrder: { id: newRouteOrderRef.id, ...newRouteOrderData },
            updatedOrders: updates,
            totalShifted: updates.length
        };
        
    } catch (error) {
        console.error('Error adding single route order:', error);
        throw new Error(`שגיאה בהוספת סדר מסלול: ${error.message}`);
    }
}

export const updateSingleRouteOrder = async (id, routeOrderData, userId) => {
    const docRef = doc(db, 'routeOrders', id);
    
    try {
        await updateDoc(docRef, {
            ...routeOrderData,
            updateBy: userId,
            updateDate: Timestamp.now(),
        });
        
        return { 
            success: true,
            id, 
            ...routeOrderData,
            updateBy: userId,
            updateDate: Timestamp.now()
        };
        
    } catch (error) {
        console.error('Error updating route order:', error);
        throw new Error(`שגיאה בעדכון סדר מסלול: ${error.message}`);
    }
}

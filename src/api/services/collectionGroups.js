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
    getCountFromServer,
    sum,
    getAggregateFromServer,
    writeBatch
} from "firebase/firestore";

export const addToCollectionGroup = async (lineId, orderIds, userId) => {

    const q = query(collection(db, 'collectionsGroups'),
        where("lineId", "==", lineId),
        where("status", "==", 1)
    );
    const getExistingGroup = await getDocs(q);


    const batch = writeBatch(db);
    let groupId;

    if (!getExistingGroup.empty) {
        groupId = getExistingGroup.docs[0].id;
    } else {
        // const newGroup = await addDoc(collection(db, 'collectionsGroupLines'), {
        //     lineId,
        //     status: 1,
        //     createdAt: Timestamp.now(),
        //     createdBy: userId,
        // });
        const newGroup = {
            lineId,
            status: 1,
            createdAt: Timestamp.now(),
            createdBy: userId,
        };

        const docRef = doc(collection(db, 'collectionsGroups'));
        batch.set(docRef, newGroup);

        groupId = docRef.id;
    }

    orderIds.forEach(orderId => {
        const orderRef = doc(db, 'orders', orderId);
        batch.update(orderRef, {
            collectionGroupId: groupId,
            orderStatus: 6,
            collectionGroupOrder: 0,
            updatedAt: Timestamp.now(),
            updatedBy: userId,
        });
    });

    await batch.commit();
    return groupId;
};

export const getOpenCollectionGroups = async () => {
    const q = query(collection(db, 'collectionsGroups'), where("status", "==", 1));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export const getProccessingCollectionGroups = async () => {
    const q = query(collection(db, 'collectionsGroups'), where("status", "in", [1, 2]));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export const getOrdersByCollectionGroup = async (collectionGroupId) => {
    const q = query(collection(db, 'orders'), where("collectionGroupId", "==", collectionGroupId));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export const saveCollectionGroupOrder = async (collectionGroupId, organized, unorganized, userId) => {

    const batch = writeBatch(db);

    // Update organized orders
    organized.forEach((order, index) => {
        const orderRef = doc(db, 'orders', order.id);
        batch.update(orderRef, {
            collectionGroupOrder: index + 1,
            updatedAt: Timestamp.now(),
            updatedBy: userId,
        });
    });

    // Update unorganized orders
    unorganized.forEach(order => {
        const orderRef = doc(db, 'orders', order.id);
        batch.update(orderRef, {
            collectionGroupOrder: 0,
            updatedAt: Timestamp.now(),
            updatedBy: userId,
        });
    });

    await batch.commit();

    const q = query(collection(db, 'orders'),
        where("collectionGroupId", "==", collectionGroupId),
        where("collectionGroupOrder", "==", 0)
    );

    const unorganizedCount = await getCountFromServer(q);
    return {
        unorganizedCount: unorganizedCount.data().count,
    }

}

export const closeCollectionGroup = async (collectionGroupId, userId) => {

    const collectionGroupRef = doc(db, 'collectionsGroups', collectionGroupId);
    await updateDoc(collectionGroupRef, {
        status: 100, // loading 
        updatedAt: Timestamp.now(),
        updatedBy: userId,
    });

    const ordersQuery = query(
        collection(db, 'orders'),
        where("collectionGroupId", "==", collectionGroupId)
    );
    const ordersSnapshot = await getDocs(ordersQuery);
    const orderIds = ordersSnapshot.docs.map(doc => doc.id);

    const products = [];
    const allProductRefs = [];

    //אני צריך לבצע לולאות על כל קבוצה של 30 הזמנות ולקבל את המוצרים שלהם ולהוסיף למערך products
    for (let i = 0; i < orderIds.length; i += 30) {
        const batchOrderIds = orderIds.slice(i, i + 30);
        const ordersQuery = query(
            collection(db, 'orderProducts'),
            where("orderId", "in", batchOrderIds)
        );
        const orderProductsSnapshot = await getDocs(ordersQuery);

        orderProductsSnapshot.docs.forEach(productDoc => {
            products.push(productDoc.data());
            allProductRefs.push({
                ref: productDoc.ref,
                data: {
                    collectionGroupId: collectionGroupId,
                    status: 2,
                }
            });
        });
    }

    const productSummary = products.reduce((acc, product) => {
        const productId = product.productId;
        if (!acc[productId]) {
            acc[productId] = {
                productId: productId,
                productName: product.productName || '',
                quantityOrWeight: 0
            };
        }
        acc[productId].quantityOrWeight += product.quantityOrWeight || 0;
        return acc;
    }, {});

    // יצירת רשימת כל העדכונים שצריך לבצע
    const allUpdates = [];

    // הוספת עדכוני המוצרים הקיימים
    allProductRefs.forEach(productRef => {
        allUpdates.push({
            type: 'update',
            ref: productRef.ref,
            data: productRef.data
        });
    });

    // הוספת יצירת מוצרי הסיכום
    for (const productId in productSummary) {
        const productData = productSummary[productId];
        const productRef = doc(collection(db, 'collectionGroupProducts'));
        allUpdates.push({
            type: 'set',
            ref: productRef,
            data: {
                ...productData,
                collectionGroupId,
                status: 1,
                employeeId: null,
                updatedAt: Timestamp.now(),
                updatedBy: userId,
            }
        });
    }

    // ביצוע העדכונים במנות של 500
    for (let i = 0; i < allUpdates.length; i += 500) {
        const batch = writeBatch(db);
        const batchUpdates = allUpdates.slice(i, i + 500);

        batchUpdates.forEach(update => {
            if (update.type === 'update') {
                batch.update(update.ref, update.data);
            } else if (update.type === 'set') {
                batch.set(update.ref, update.data);
            }
        });

        await batch.commit();
    }

    // עדכון הסטטוס אחרון כדי לוודא שהכל עבר תקין
    await updateDoc(collectionGroupRef, {
        status: 2,
        updatedAt: Timestamp.now(),
        updatedBy: userId,
    });
};

export const getCollectionGroupById = async (collectionGroupId) => {
    const docRef = doc(db, 'collectionsGroups', collectionGroupId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
    } else {
        throw new Error("No such document!");
    }
}

export const getCollectionGroupProducts = async (collectionGroupId) => {
    const q = query(
        collection(db, 'collectionGroupProducts'),
        where("collectionGroupId", "==", collectionGroupId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

export const saveEmployeeProductAssignments = async (collectionGroupId, products) => {
    const batch = writeBatch(db);
    
    // Update each product with its assigned employee
    products.forEach(product => {
        const productRef = doc(db, 'collectionGroupProducts', product.id);
        batch.update(productRef, {
            assignedEmployeeId: product.assignedEmployeeId,
            updatedAt: Timestamp.now()
        });
    });
    
    // Commit the batch
    await batch.commit();
}

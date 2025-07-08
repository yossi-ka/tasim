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

}

export const closeCollectionGroup = async (collectionGroupId, userId) => {
    const collectionGroupRef = doc(db, 'collectionsGroups', collectionGroupId);
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

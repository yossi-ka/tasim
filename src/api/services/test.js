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
    writeBatch,
    limit,
    arrayUnion
} from "firebase/firestore";


export const getLastOrdersByUpdate = async () => {
    const ordersRef = collection(db, "orders");
    const q = query(ordersRef, orderBy("updateDate", "desc"), limit(103));
    const querySnapshot = await getDocs(q);
    const orders = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data(), updateDate: doc.data().updateDate.toDate() }));
    // return orders;
    const batch = writeBatch(db);
    orders.forEach(order => {
        const orderRef = doc(ordersRef, order.id);
        batch.update(orderRef, { orderStatus: 1 });
    });
    await batch.commit();
    return orders;
}

export const getProductWithQuantityForShipping = async () => {

    const p = query(collection(db, "products"), where("isQuantityForShipping", "==", true));
    const querySnapshot = await getDocs(p);
    const products = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const batch = writeBatch(db);
    products.forEach(product => {
        const productRef = doc(collection(db, "products"), product.id);
        batch.update(productRef, { isQuantityForShipping: false, categories: arrayUnion("EMqF46IO87uoCUKEXgpT"), });
    });
    // await batch.commit();
    return products;
}


export const getOpenCollectionGroups = async () => {

    const ids = [
        "KsHviPjaaAH2Nkd9UVnd",//ד
        "L3pCzn6Kcc0Qct2RKZ88",//ב
        "JoWWEiNIlPdkxJq8Lg47",//א
        "kM6KZ16MNdieqHmcQxq0",//ו
        "KSXAdwoyBnJLX5DEcGwD",//ה
        "IzFooSXyg30crRPD16xw",//ג
        "NHZMhPHoqyDXVUuDLIM9",//ז
        "TXPwzHR1SCaBOGNjFsuV",//ט
        "I7mHtySzTqpdMLgMNPTn",//י
        // "1ZX0tQo7KhNSQ5k956nM",//ח

    ]

    const collectionGroupProducts = await getDocs(query(collection(db, "collectionGroupProducts"), where("collectionGroupId", "in", ids)));
    const collectionGroupProductsData = collectionGroupProducts.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const batch = writeBatch(db);
    collectionGroupProductsData.forEach(product => {
        const productRef = doc(collection(db, "collectionGroupProducts"), product.id);
        batch.update(productRef, { status: 3 });
    });


    const orders = await getDocs(query(collection(db, "orders"), where("collectionGroupId", "in", ids)));
    const ordersData = orders.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    ordersData.forEach(order => {
        const orderRef = doc(collection(db, "orders"), order.id);
        batch.update(orderRef, { orderStatus: 3 });
    });

    const collectionGroups = await getDocs(query(collection(db, "collectionsGroups"), where("__name__", "in", ids)));
    const collectionGroupsData = collectionGroups.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    collectionGroupsData.forEach(group => {
        const groupRef = doc(collection(db, "collectionsGroups"), group.id);
        batch.update(groupRef, { status: 3 });
    });

    await batch.commit();
    console.log("collectionGroupProductsData", collectionGroupProductsData);
    console.log("ordersData", ordersData);
    console.log("collectionGroupsData", collectionGroupsData);
}
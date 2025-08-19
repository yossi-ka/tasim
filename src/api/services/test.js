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
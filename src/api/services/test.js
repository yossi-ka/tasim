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


export const updateCollectionGroups = async () => {
    const collectionGroups = await getDocs(query(collection(db, "collectionsGroups"), where("status", "==", 2)));
    const collectionData = collectionGroups.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const fData = await Promise.all(collectionData.map(async (collectionGroup) => {
        const countOrderProducts = await getCountFromServer(query(collection(db, "orderProducts"), where("collectionGroupId", "==", collectionGroup.id), where("status", "==", 2)));
        return { ...collectionGroup, countOrderProducts: countOrderProducts.data().count };
    }));

    console.log("Updated collection groups:", fData);

    const batch = writeBatch(db);
    fData.forEach(collectionGroup => {
        if (collectionGroup.countOrderProducts != 0) {
            console.log("Collection group with products:", collectionGroup);
            return;
        }
        const groupRef = doc(collection(db, "collectionsGroups"), collectionGroup.id);
        batch.update(groupRef, { status: 3, updatedAt: Timestamp.now() });
    });
    await batch.commit();

}


export const updateProductSku = async (productsFromFile) => {

    const existingProducts = await getDocs(query(collection(db, "products")));
    const existingProductsData = existingProducts.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const mapedProducts = existingProductsData.reduce((acc, product) => {
        acc[product.phoneCode] = product;
        return acc;
    }, {});

    const batch = writeBatch(db);
    productsFromFile.forEach(product => {
        const existingProduct = mapedProducts[product.phoneCode];
        if (existingProduct && product.phoneCode) {
            const productRef = doc(collection(db, "products"), existingProduct.id);
            batch.update(productRef, {
                quantity: product.quantity || "",
                manufacturer: product.manufacturer || "",
                hashgacha: product.hashgacha || "",
                sku: product.sku || ""
            });
        }
    });
    await batch.commit();
    alert("Product SKUs updated successfully");
}


export const getTextPlace = async () => {
    const existingProducts = await getDocs(query(collection(db, "products")));
    const existingProductsData = existingProducts.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const res = existingProductsData.filter(product => (product.productPlace || "").match(/[^0-9]/));
    console.log(res.map(product => product.orginalFullName).join("\n"))
    return res;
}

export const fixProductPlaces = async () => {

    console.log(1)
    const existingProducts = await getDocs(query(collection(db, "products")));
    const existingProductsData = existingProducts.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log(2)
    const batch = writeBatch(db);
    existingProductsData.forEach(product => {
        const productRef = doc(collection(db, "products"), product.id);

        const place = product.productPlace || "";
        const cleanedPlace = place.includes('-')
            ? place.split('-')[0].replace(/[^0-9]/g, "")
            : place.replace(/[^0-9]/g, "");
        const numericPlace = cleanedPlace ? Number(cleanedPlace) : 0;
        batch.update(productRef, { productPlace: numericPlace });
    });
    console.log(3)
    await batch.commit();
    alert("Product places fixed successfully");
}
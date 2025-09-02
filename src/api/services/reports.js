import { db } from '../../firebase-config'

import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, Timestamp, updateDoc, where, writeBatch, getCountFromServer, arrayUnion, arrayRemove, limit } from "firebase/firestore";
import { formatDate } from '../../utils/func';

export const getAllProductsForReport = async (dateRange) => {
    const { startDate, endDate } = dateRange;

    console.log('Fetching all products for report between ', formatDate(startDate), ' and ', formatDate(endDate));

    // קודם נמצא את ההזמנות בטווח התאריכים
    const ordersQ = query(collection(db, "orders"),
        where("closedAt", ">=", new Date(startDate)),
        where("closedAt", "<=", new Date(endDate)));
    const ordersSnapshot = await getDocs(ordersQ);
    const ordersData = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    const ordersIds = ordersData.map(order => order.id);

    // אם אין הזמנות בטווח התאריכים, נחזיר מערך ריק
    if (ordersIds.length === 0) {
        return { productData: [], ordersData: [], orderProducts: [] };
    }

    // נמצא את מוצרי ההזמנות
    const orderProducts = [];
    for (let i = 0; i < ordersIds.length; i += 30) {
        const batch = ordersIds.slice(i, i + 30);
        const orderProductsQ = query(collection(db, "orderProducts"), where("orderId", "in", batch));
        const orderProductsSnapshot = await getDocs(orderProductsQ);
        orderProducts.push(...orderProductsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }

    // נמצא את המוצרים הייחודיים שהיו בהזמנות
    const uniqueProductIds = [...new Set(orderProducts.map(op => op.productId))];

    // נביא רק את המוצרים שהיו בהזמנות
    const productData = [];
    for (let i = 0; i < uniqueProductIds.length; i += 30) {
        const batch = uniqueProductIds.slice(i, i + 30);
        const productsQ = query(collection(db, "products"), where("__name__", "in", batch));
        const productsSnapshot = await getDocs(productsQ);

        const batchProducts = productsSnapshot.docs.map(doc => {
            const data = doc.data();
            if (!isNaN(data.lastBuyPrice) && !isNaN(data.price)) {
                data.profit = data.price - data.lastBuyPrice;
                data.profitPercentage = data.lastBuyPrice ? (data.profit / data.lastBuyPrice) * 100 : 0;
            }
            return { id: doc.id, ...data };
        });

        productData.push(...batchProducts);
    }

    // מיון המוצרים לפי שם
    productData.sort((a, b) => a.name.localeCompare(b.name));

    return { productData, ordersData, orderProducts };
}
import { db } from '../../firebase-config'

import { addDoc, collection, doc, getDoc, getDocs, orderBy, query, Timestamp, updateDoc, where, writeBatch, getCountFromServer, arrayUnion, arrayRemove } from "firebase/firestore";
import { formatDate } from '../../utils/func';

export const getAllProductsForReport = async (dateRange) => {
    const { startDate, endDate } = dateRange;
    console.log('Fetching all products for report between ', formatDate(startDate), ' and ', formatDate(endDate));
    const productsRef = collection(db, "products");
    const q = query(productsRef, orderBy("name", "asc"));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => {
        const data = doc.data();
        if (!isNaN(data.lastBuyPrice) && !isNaN(data.price)) {
            data.profit = data.price - data.lastBuyPrice;
            data.profitPercentage = data.lastBuyPrice ? (data.profit / data.lastBuyPrice) * 100 : 0;
        }
        return { id: doc.id, ...data };
    });
}
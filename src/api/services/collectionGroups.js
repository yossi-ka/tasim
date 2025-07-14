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


/*

פירוט סטטוסים
collectionsGroups:
1 - ראשוני ופתוח וניתן להוסיף הזמנות
2 - מסלול סגור ואין אפשרות להוסיף הזמנות, בתהליך ליקוט
3 - תהליך הליקוט הסתיים והזמנות עברו לסטטוס במשלוח

collectionGroupProducts:
1 - מוצר פעיל בקבוצת האיסוף
2 - אספו את המוצר מהמדף
3 - סיימו לפזר את המוצר בהזמנות

orderProducts:
1 - 
2 - מוצר שייך לקבוצה
3 - מוצר הונח בהזמנה
4 - מוצר חסר
5 - מוצר נאסף מהמדף
*/

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

    // הוספת יצירת מוצרי הסיכום - כולל productPlace
    // שליפת productPlace לכל productId במנות של 30
    const allProductIds = Object.keys(productSummary);
    const productPlaces = {};
    for (let i = 0; i < allProductIds.length; i += 30) {
        const batchProductIds = allProductIds.slice(i, i + 30);
        const productsDetailsQuery = query(
            collection(db, 'products'),
            where("__name__", "in", batchProductIds)
        );
        const productsDetailsSnapshot = await getDocs(productsDetailsQuery);
        productsDetailsSnapshot.docs.forEach(doc => {
            productPlaces[doc.id] = doc.data().productPlace || null;
        });
    }
    for (const productId in productSummary) {
        const productData = productSummary[productId];
        const productRef = doc(collection(db, 'collectionGroupProducts'));
        allUpdates.push({
            type: 'set',
            ref: productRef,
            data: {
                ...productData,
                productPlace: productPlaces[productId] || null,
                collectionGroupId,
                status: 1,
                assignedEmployeeId: null,
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

export const getCollectionGroupProductsWithOrders = async (collectionGroupId) => {
    // שליפה מרוכזת של כל הנתונים הדרושים

    // קבלת המוצרים מטבלת collectionGroupProducts
    const productsQuery = query(
        collection(db, 'collectionGroupProducts'),
        where("collectionGroupId", "==", collectionGroupId)
    );
    const productsSnapshot = await getDocs(productsQuery);
    const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // אין צורך להביא productPlace מטבלת products - הוא כבר קיים בכל רשומה

    // קבלת כל פריטי ההזמנות עבור קבוצת האיסוף
    const orderProductsQuery = query(
        collection(db, 'orderProducts'),
        where("collectionGroupId", "==", collectionGroupId)
    );
    const orderProductsSnapshot = await getDocs(orderProductsQuery);
    const orderProducts = orderProductsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // קבלת כל ההזמנות עבור קבוצת האיסוף
    const ordersQuery = query(
        collection(db, 'orders'),
        where("collectionGroupId", "==", collectionGroupId)
    );
    const ordersSnapshot = await getDocs(ordersQuery);
    const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // יצירת מפה של ההזמנות לפי ID
    const ordersMap = orders.reduce((map, order) => {
        map[order.id] = order;
        return map;
    }, {});

    // קיבוץ פריטי ההזמנות לפי מוצר
    const orderProductsByProduct = orderProducts.reduce((acc, orderProduct) => {
        const productId = orderProduct.productId;
        if (!acc[productId]) {
            acc[productId] = [];
        }
        acc[productId].push(orderProduct);
        return acc;
    }, {});

    // יצירת התוצאה הסופית
    let productsWithOrders = products.map(product => {
        const productOrderProducts = orderProductsByProduct[product.productId] || [];
        // יצירת מערך של אובייקטים מחוברים של הזמנה ומוצר
        let ordersWithProductDetails = productOrderProducts.map(orderProduct => {
            const orderData = ordersMap[orderProduct.orderId];
            return {
                product: orderProduct,
                order: orderData,
            };
        }).filter(item => item.order !== null);
        // מיון פנימי של ההזמנות לפי collectionGroupOrder
        ordersWithProductDetails = ordersWithProductDetails.sort((a, b) => {
            const aOrder = a.order?.collectionGroupOrder ?? 0;
            const bOrder = b.order?.collectionGroupOrder ?? 0;
            return aOrder - bOrder;
        });
        return {
            ...product,
            orders: ordersWithProductDetails
        };
    });

    // מיון products לפי הערך המספרי ב-productPlace
    const extractNumber = (val) => {
        if (!val) return Infinity;
        const match = String(val).match(/\d+/);
        return match ? parseInt(match[0], 10) : Infinity;
    };
    productsWithOrders = productsWithOrders.sort((a, b) => {
        const aNum = extractNumber(a.productPlace);
        const bNum = extractNumber(b.productPlace);
        return aNum - bNum;
    });

    return productsWithOrders;
};

// מחזירה גם את ordersWithProducts וגם את collectionGroupProducts
export const getCollectionOrdersAndGroupProducts = async (collectionGroupId) => {
    // קבלת כל פריטי ההזמנות עבור קבוצת האיסוף
    const orderProductsQuery = query(
        collection(db, 'orderProducts'),
        where("collectionGroupId", "==", collectionGroupId)
    );
    const orderProductsSnapshot = await getDocs(orderProductsQuery);
    const orderProducts = orderProductsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // קבלת כל ההזמנות עבור קבוצת האיסוף
    const ordersQuery = query(
        collection(db, 'orders'),
        where("collectionGroupId", "==", collectionGroupId)
    );
    const ordersSnapshot = await getDocs(ordersQuery);
    const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // קבלת כל collectionGroupProducts עבור קבוצת האיסוף
    const groupProductsQuery = query(
        collection(db, 'collectionGroupProducts'),
        where("collectionGroupId", "==", collectionGroupId)
    );
    const groupProductsSnapshot = await getDocs(groupProductsQuery);
    const collectionGroupProducts = groupProductsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // יצירת Map של orderId ל-array של products
    const productsByOrderId = orderProducts.reduce((acc, product) => {
        if (!acc[product.orderId]) acc[product.orderId] = [];
        acc[product.orderId].push(product);
        return acc;
    }, {});

    // יצירת Map של productId לסטטוס מתוך collectionGroupProducts
    const groupProductStatusMap = collectionGroupProducts.reduce((acc, groupProduct) => {
        if (groupProduct.status === 2) {
            acc[groupProduct.productId] = 2;
        }
        return acc;
    }, {});

    // בניית מערך ההזמנות עם הפריטים שלהם, כולל עדכון סטטוס במידת הצורך
    const ordersWithProducts = orders.map(order => {
        const products = (productsByOrderId[order.id] || []).map(product => {
            // בדיקה אם יש productId כזה ב-collectionGroupProducts עם סטטוס 2
            if (groupProductStatusMap[product.productId] === 2 && product.status === 2) {
                return { ...product, status: 5 };
            }
            return product;
        });

        // חישוב כמויות לכל סטטוס
        const statusCount = products.reduce((acc, p) => {
            if (p.status === 2) acc.status2++;
            if (p.status === 3) acc.status3++;
            if (p.status === 4) acc.status4++;
            if (p.status === 5) acc.status5++;
            return acc;
        }, { status2: 0, status3: 0, status4: 0, status5: 0 });

        return {
            ...order,
            products,
            countStatus2: statusCount.status2,
            countStatus3: statusCount.status3,
            countStatus4: statusCount.status4,
            countStatus5: statusCount.status5
        };
    })
        .sort((a, b) => {
            const aOrder = a.collectionGroupOrder || 0;
            const bOrder = b.collectionGroupOrder || 0;
            return aOrder - bOrder;
        });

    return ordersWithProducts;
}
export const getCollectionOrderWithProducts = async (collectionGroupId) => {

    // קבלת כל פריטי ההזמנות עבור קבוצת האיסוף
    const orderProductsQuery = query(
        collection(db, 'orderProducts'),
        where("collectionGroupId", "==", collectionGroupId)
    );
    const orderProductsSnapshot = await getDocs(orderProductsQuery);
    const orderProducts = orderProductsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // קבלת כל ההזמנות עבור קבוצת האיסוף
    const ordersQuery = query(
        collection(db, 'orders'),
        where("collectionGroupId", "==", collectionGroupId)
    );
    const ordersSnapshot = await getDocs(ordersQuery);
    const orders = ordersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // יצירת Map של orderId ל-array של products
    const productsByOrderId = orderProducts.reduce((acc, product) => {
        if (!acc[product.orderId]) acc[product.orderId] = [];
        acc[product.orderId].push(product);
        return acc;
    }, {});

    // בניית מערך ההזמנות עם הפריטים שלהם
    const ordersWithProducts = orders.map(order => ({
        ...order,
        products: productsByOrderId[order.id] || []
    }))
        .sort((a, b) => {
            const aOrder = a.collectionGroupOrder || 0;
            const bOrder = b.collectionGroupOrder || 0;
            return aOrder - bOrder;
        });

    return ordersWithProducts;
}

export const completeCollectionGroup = async (collectionGroupId, userId, employeeId = null) => {
    const collectionGroupRef = doc(db, 'collectionsGroups', collectionGroupId);
    await updateDoc(collectionGroupRef, {
        status: 100, // loading 
        updatedAt: Timestamp.now(),
        updatedBy: userId,
    });

    // עדכון הסטטוס של כל ההזמנות בקבוצת האיסוף
    const ordersQuery = query(
        collection(db, 'orders'),
        where("collectionGroupId", "==", collectionGroupId)
    );
    const ordersSnapshot = await getDocs(ordersQuery);
    const orderDocs = ordersSnapshot.docs;

    // עדכון הסטטוס של כל המוצרים בקבוצת האיסוף
    const productsQuery = query(
        collection(db, 'collectionGroupProducts'),
        where("collectionGroupId", "==", collectionGroupId),
        where("status", "!=", 3) // רק מוצרים פעילים
    );
    const productsSnapshot = await getDocs(productsQuery);
    const productDocs = productsSnapshot.docs;

    // קבלת כל המוצרים 
    const allProductsQuery = query(
        collection(db, 'orderProducts'),
        where("collectionGroupId", "==", collectionGroupId),
        where("status", "!=", 3)
    );
    const allProductsSnapshot = await getDocs(allProductsQuery);
    const allProductDocs = allProductsSnapshot.docs;

    // איגוד כל העדכונים
    const updates = [];

    // orders
    orderDocs.forEach(orderDoc => {
        const orderRef = doc(db, 'orders', orderDoc.id);
        updates.push({
            ref: orderRef,
            data: {
                orderStatus: 4, // סיום
                employeeId,
                updatedAt: Timestamp.now(),
                updatedBy: userId,
            }
        });
    });

    // collectionGroupProducts
    productDocs.forEach(productDoc => {
        const productRef = doc(db, 'collectionGroupProducts', productDoc.id);
        updates.push({
            ref: productRef,
            data: {
                status: 3, // סיום
                updatedAt: Timestamp.now(),
                updatedBy: userId,
            }
        });
    });

    // orderProducts
    allProductDocs.forEach(productDoc => {
        const productRef = doc(db, 'orderProducts', productDoc.id);
        updates.push({
            ref: productRef,
            data: {
                status: 3, // סיום
                updatedAt: Timestamp.now(),
                updatedBy: userId,
            }
        });
    });

    // בצע עדכונים במנות של 500
    for (let i = 0; i < updates.length; i += 500) {
        const batch = writeBatch(db);
        const batchUpdates = updates.slice(i, i + 500);
        batchUpdates.forEach(update => {
            batch.update(update.ref, update.data);
        });
        await batch.commit();
    }

    // עדכון הסטטוס של קבוצת האיסוף לסיום
    await updateDoc(collectionGroupRef, {
        status: 3, // סיום
        updatedAt: Timestamp.now(),
        updatedBy: userId,
    });
}

export const moveAllOrdersFrom4To5 = async (userId) => {
    const q = query(
        collection(db, 'orders'),
        where("orderStatus", "==", 4)
    );
    const querySnapshot = await getDocs(q);
    const orderDocs = querySnapshot.docs;

    //  const orderProductsCountSnap = await db.collection('orderProducts')
    //         .where('orderId', '==', orderId)
    //         .where('status', '==', 2)
    //         .count()
    //         .get();

    // const orderProductsSnap = await query(
    //     collection(db, 'orderProducts'),
    //     where('status', '==', 2),
    //     where('orderId', '==', "orderDocs.map(doc => doc.id)")
    // );

    // const d = getDocs(orderProductsSnap);
    console.log(`Moving ${orderDocs.length} orders from status 4 to 5`);
    const batch = writeBatch(db);

    orderDocs.forEach(orderDoc => {
        const orderRef = doc(db, 'orders', orderDoc.id);
        batch.update(orderRef, {
            orderStatus: 5, // סיום
            // employeeId: "h6iEY6mmMkvCsWI2MW8g",
            // updatedAt: Timestamp.now(),
            // updatedBy: userId,
        });
    });

    await batch.commit();
    console.log(`Successfully moved ${orderDocs.length} orders from status 4 to 5`);
    return orderDocs.length;
}


export const updateMissingProduct = async (orderProductId, userId) => {
    try {
        if (orderProductId) {
            const orderProductRef = doc(db, 'orderProducts', orderProductId);
            const orderProductSnap = await getDoc(orderProductRef);

            if (!orderProductSnap.exists()) {
                return { status: "error", message: "מוצר לא קיים" };
            }

            await updateDoc(orderProductRef, {
                status: 4, // סטטוס חסר
                updatedAt: Timestamp.now(),
                updatedBy: userId,
            });

            return { status: 'ok', message: 'העדכון התקבל בהצלחה' };
        }
        return { status: "error", message: "חסר מזהה מוצר" };
    } catch (e) {
        return { status: "error", message: e.message || "שגיאה בעדכון המוצר" };
    }
}

export const getProductsWithOrdersAndStatusSummary = async (collectionGroupId) => {
    // שליפת כל פריטי ההזמנות עבור קבוצת האיסוף
    const orderProductsQuery = query(
        collection(db, 'orderProducts'),
        where("collectionGroupId", "==", collectionGroupId)
    );
    const orderProductsSnapshot = await getDocs(orderProductsQuery);
    const orderProducts = orderProductsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // שליפת כל המוצרים מטבלת collectionGroupProducts
    const productsQuery = query(
        collection(db, 'collectionGroupProducts'),
        where("collectionGroupId", "==", collectionGroupId)
    );
    const productsSnapshot = await getDocs(productsQuery);
    const products = productsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // שליפת כל ההזמנות עבור קבוצת האיסוף (כדי להחזיר פרטי הזמנה)
    const ordersQuery = query(
        collection(db, 'orders'),
        where("collectionGroupId", "==", collectionGroupId)
    );
    const ordersSnapshot = await getDocs(ordersQuery);
    const ordersMap = ordersSnapshot.docs.reduce((map, doc) => {
        map[doc.id] = { id: doc.id, ...doc.data() };
        return map;
    }, {});

    // קיבוץ orderProducts לפי productId
    const orderProductsByProductId = orderProducts.reduce((acc, op) => {
        if (!acc[op.productId]) acc[op.productId] = [];
        acc[op.productId].push(op);
        return acc;
    }, {});

    // בניית מערך collectionGroupProducts עם orders וסיכום סטטוסים
    const result = products.map(product => {
        const productOrderProducts = orderProductsByProductId[product.productId] || [];
        // לכל orderProduct נחבר גם את פרטי ההזמנה
        const orders = productOrderProducts.map(op => {
            if (op.status === 2 && product.status === 2) op.status = 5; // אם המוצר נאסף מהמדף, נעדכן את הסטטוס ל-5
            return {
                ...op,
                order: ordersMap[op.orderId] || null,
                orderFullName: ordersMap[op.orderId] ? `${ordersMap[op.orderId].firstName || ""} ${ordersMap[op.orderId].lastName || ""}` : null
            }
        });
        // חישוב סיכום סטטוסים 2,3,4
        const statusSummary = productOrderProducts.reduce((acc, op) => {
            if (op.status === 2) acc.status2++;
            if (op.status === 3) acc.status3++;
            if (op.status === 4) acc.status4++;
            if (op.status === 5) acc.status5++;
            return acc;
        }, { status2: 0, status3: 0, status4: 0, status5: 0 });

        return {
            ...product,
            orders,
            ...statusSummary
        };
    });

    return result;
};

export const getMissingProductsByOrder = async (collectionGroupId) => {
    const q = query(
        collection(db, 'orderProducts'),
        where("collectionGroupId", "==", collectionGroupId),
        where("status", "==", 4) // סטטוס חסר
    );
    const querySnapshot = await getDocs(q);
    const missingProducts = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const uniqueOrderIds = [...new Set(missingProducts.map(mp => mp.orderId))];

    const orders = [];
    //get in 30 batches
    for (let i = 0; i < uniqueOrderIds.length; i += 30) {
        const batchOrderIds = uniqueOrderIds.slice(i, i + 30);
        const ordersQuery = query(
            collection(db, 'orders'),
            where("__name__", "in", batchOrderIds)
        );
        const ordersSnapshot = await getDocs(ordersQuery);
        ordersSnapshot.docs.forEach(doc => {
            orders.push({ id: doc.id, ...doc.data() });
        });
    }

    const productOrdersMap = missingProducts.reduce((acc, product) => {
        if (!acc[product.orderId]) acc[product.orderId] = [];
        acc[product.orderId].push(product);
        return acc;
    }, {});

    return orders.map(order => {
        return {
            ...order,
            missingProducts: productOrdersMap[order.id] || []
        };
    })
}



export const updateCollectionGroupProducts = async () => {
    const collectionGroupId = "k04NXPMZMXZLX8BsrO7J"
    const q = query(
        collection(db, 'collectionGroupProducts'),
        where("collectionGroupId", "==", collectionGroupId)
    );
    const querySnapshot = await getDocs(q);
    // return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    console.log(`Updating ${querySnapshot.docs.length} products in collection group ${collectionGroupId}`);
    const batch = writeBatch(db);
    querySnapshot.docs.forEach(doc => {
        const productRef = doc.ref;
        batch.update(productRef, {
            assignedEmployeeId: null, // עדכון הסטטוס למצב פעיל
        });
    });

    await batch.commit();
    console.log(`Successfully updated ${querySnapshot.docs.length} products in collection group ${collectionGroupId}`);
}
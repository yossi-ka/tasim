const { db } = require("../firebase-config");
const { Timestamp } = require("firebase-admin/firestore");


const jwt = require('jsonwebtoken');
const { formatDateTime } = require("../utils");

const SECRET_KEY = 'israel_kanfash';

const login = async (userName, password, cardNumber) => {

    let user;
    if (cardNumber) {
        console.log(cardNumber, "cardNumber")
        user = await db.collection('employees')
            .where('cardNumber', '==', cardNumber)
            .get()
    } else {
        user = await db.collection('employees')
            .where('username', '==', userName)
            .where('password', '==', password)
            .get()
    }

    if (user.empty) {
        return null;
    }
    const token = jwt.sign({
        userName,
        userId: user.docs[0].id,

    }, SECRET_KEY, { expiresIn: '2d' });

    const userData = user.docs[0].data();
    const userFullName = (userData.firstName || "") + " " + (userData.lastName || "");
    return {
        token,
        userName: userFullName,
    };

}

const checkUser = async (token) => {
    try {
        const decoded = jwt.verify(token, SECRET_KEY);
        const { userName, userId, userType } = decoded;

        const user = await db.doc('employees/' + userId).get()

        if (!user.exists)
            throw new Error("invalid user")

        return {
            userId,
            userType
        }

    } catch (err) {
        console.log(err, "error check user")
        return null
    }
}

const getProducts = async (userId) => {
    const collectionGroupProductsSnap = await db
        .collection('collectionGroupProducts')
        .where("assignedEmployeeId", "==", userId)
        .where("status", "in", [1, 2])
        .get();

    let products = collectionGroupProductsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // מיון products לפי הערך המספרי ב-productPlace
    products = products.sort((a, b) => {
        const aNum = extractNumber(a.productPlace);
        const bNum = extractNumber(b.productPlace);
        return aNum - bNum;
    });

    // איסוף מזהים ייחודיים של collectionGroupId
    const groupIds = [...new Set(products.map(p => p.collectionGroupId).filter(Boolean))];
    let groupsMap = {};

    let lineIds = [];
    let linesMap = {};
    if (groupIds.length > 0) {
        // שליפה מרוכזת של כל הקבוצות
        const groupsSnap = await db
            .collection('collectionsGroups')
            .where("__name__", 'in', groupIds)
            .get();
        groupsMap = groupsSnap.docs.reduce((acc, doc) => {
            acc[doc.id] = { id: doc.id, ...doc.data() };
            return acc;
        }, {});
        // איסוף מזהי lineId ייחודיים
        lineIds = [...new Set(groupsSnap.docs.map(doc => doc.data().lineId).filter(Boolean))];
        if (lineIds.length > 0) {
            // שליפה מרוכזת של כל ה-lines
            const linesSnap = await db
                .collection('collectionsGroupLines')
                .where("code", 'in', lineIds)
                .get();
            linesMap = linesSnap.docs.reduce((acc, doc) => {
                const data = doc.data();
                // acc[doc.id] = { id: doc.id, ...doc.data() };
                acc[data.code] = { id: doc.id, ...data };
                return acc;
            }, {});
        }
    }

    // הוספת groupData ולתוכה lineData לכל מוצר
    products = products.map(product => {
        const group = groupsMap[product.collectionGroupId] || null;
        const line = group ? linesMap[group.lineId] || null : null;
        return {
            ...product,
            cartIndex: product.cartIndex || 0,
            color: line ? line.color : null,
        };
    });
    return products;
};

const approveProducts = async (productsData, userId) => {
    const batch = db.batch();
    for (const productData of productsData) {
        const docRef = db.doc('collectionGroupProducts/' + productData.id);
        batch.update(docRef, {
            status: 2,
            cartIndex: productData.cartIndex,
            updateBy: "pos",
            updateDate: Timestamp.now(),
            updateStatus: Timestamp.now(),
            collectBy: userId,
        });
    }
    await batch.commit();
    return true;
};

const getOrderProducts = async (userId, viewMode = "order") => {
    // שלב 1: שליפת כל המוצרים של העובד בעגלה (סטטוס 2)
    const collectionGroupProductsSnap = await db
        .collection('collectionGroupProducts')
        .where("assignedEmployeeId", "==", userId)
        .where("status", "==", 2)
        .get();

    const groupProducts = collectionGroupProductsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    if (groupProducts.length === 0) return [];

    // יצירת מפה של collectionGroupProducts לפי productId
    const groupProductsMap = {};
    groupProducts.forEach(gp => {
        groupProductsMap[gp.productId] = gp;
    });

    // מערך מזהי groupId ו-productId
    const groupIds = [...new Set(groupProducts.map(doc => doc.collectionGroupId).filter(Boolean))];
    const productIds = [...new Set(groupProducts.map(doc => doc.productId).filter(Boolean))];

    // שלב 2: שליפת orderProducts במנות של 30
    let orderProducts = [];
    for (let i = 0; i < groupIds.length; i += 1) {
        const groupBatch = groupIds.slice(i, i + 1);
        for (let j = 0; j < productIds.length; j += 30) {
            const productBatch = productIds.slice(j, j + 30);

            const snap = await db
                .collection('orderProducts')
                .where("collectionGroupId", "in", groupBatch)
                .where("productId", "in", productBatch)
                .where("status", "==", 2)
                .get();
            orderProducts.push(...snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        }
    }
    if (orderProducts.length === 0) return [];

    // שלב 3: שליפת כל orders במנות של 30
    const orderIds = [...new Set(orderProducts.map(op => op.orderId).filter(Boolean))];
    let ordersMap = {};
    for (let i = 0; i < orderIds.length; i += 30) {
        const batch = orderIds.slice(i, i + 30);
        const snap = await db
            .collection('orders')
            .where("__name__", "in", batch)
            .get();
        snap.docs.forEach(doc => {
            ordersMap[doc.id] = { id: doc.id, ...doc.data() };
        });
    }

    // שלב 4: שליפת כל הקבוצות (collectionsGroups) במנות של 30
    // let groupsMap = {};
    // for (let i = 0; i < groupIds.length; i += 30) {
    //     const batch = groupIds.slice(i, i + 30);
    //     const snap = await db
    //         .collection('collectionsGroups')
    //         .where("__name__", "in", batch)
    //         .get();
    //     snap.docs.forEach(doc => {
    //         groupsMap[doc.id] = { id: doc.id, ...doc.data() };
    //     });
    // }

    // שלב 5: שליפת כל ה-lines (collectionsGroupLines) במנות של 30
    // const lineIds = [...new Set(Object.values(groupsMap).map(g => g.lineId).filter(Boolean))];
    // let linesMap = {};
    // for (let i = 0; i < lineIds.length; i += 30) {
    //     const batch = lineIds.slice(i, i + 30);
    //     const snap = await db
    //         .collection('collectionsGroupLines')
    //         .where("code", "in", batch)
    //         .get();
    //     snap.docs.forEach(doc => {
    //         const data = doc.data();
    //         linesMap[data.code] = { id: doc.id, ...data };
    //     });
    // }

    // שלב 6: בניית מערך שטוח עם כל המידע
    const result = orderProducts.map(op => {
        const order = ordersMap[op.orderId] || {};
        // מציאת ה-collectionGroupProduct המתאים לפי productId
        const groupProduct = groupProductsMap[op.productId] || {};

        return {
            id: op.id,
            productName: op.productName,
            collectionGroupOrder: order.collectionGroupOrder,
            quantityOrWeight: op.quantityOrWeight || 0, // אם אין כמות, נניח 1
            orderId: order.id,
            firstName: order.firstName,
            lastName: order.lastName,
            productPlace: groupProduct.productPlace || '',
            orderProductId: op.id,
            cartIndex: groupProduct.cartIndex || 0,
            // color: line.color || null
        };
    });

    // מיון לפי collectionGroupOrder ואז לפי productPlace
    result.sort((a, b) => {

        if (viewMode === "order") {
            const orderA = a.collectionGroupOrder || 0;
            const orderB = b.collectionGroupOrder || 0;
            if (orderA !== orderB) return orderA - orderB;
        }
        // אם אותו collectionGroupOrder, מיין לפי productPlace
        const aNum = extractNumber(a.productPlace);
        const bNum = extractNumber(b.productPlace);
        if (aNum !== bNum) {
            return aNum - bNum;
        }
        const orderA = a.collectionGroupOrder || 0;
        const orderB = b.collectionGroupOrder || 0;
        return orderA - orderB;
    });
    return result;
};

const approveOrderProducts = async (products, userId) => {
    const batch = db.batch();
    for (const product of products) {
        const docRef = db.doc('orderProducts/' + product);
        batch.update(docRef, {
            status: 3,
            updateBy: "pos",
            updateDate: Timestamp.now(),
            updateStatus: Timestamp.now(),
            collectBy: userId,
        });
    }
    await batch.commit();
    return true;
};

const getOrders = async (userId) => {
    const orders = await db.collection('orders')
        .where("employeeId", "==", userId)
        .where("orderStatus", "==", 4).get();

    if (orders.empty) {
        return [];
    }

    // שלב 1: שליפת כל הקטגוריות (טבלה קטנה)
    const categoriesSnap = await db.collection('globalProductCategories').get();
    const categoriesMap = {};
    categoriesSnap.docs.forEach(doc => {
        categoriesMap[doc.id] = doc.data().name;
    });

    // שלב 2: שליפת כל orderProducts לפי orderIds במנות של 30
    const orderIds = orders.docs.map(doc => doc.id);
    let allOrderProducts = [];
    for (let i = 0; i < orderIds.length; i += 30) {
        const batch = orderIds.slice(i, i + 30);
        const snap = await db
            .collection('orderProducts')
            .where("orderId", "in", batch)
            .get();
        allOrderProducts.push(...snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }

    // שלב 3: איסוף כל productIds ייחודיים מכל ההזמנות
    const uniqueProductIds = [...new Set(allOrderProducts.map(op => op.productId).filter(Boolean))];

    // שלב 4: שליפת כל המוצרים הרלוונטיים במנות של 30
    let productsMap = {};
    for (let i = 0; i < uniqueProductIds.length; i += 30) {
        const batch = uniqueProductIds.slice(i, i + 30);
        const snap = await db
            .collection('products')
            .where("__name__", "in", batch)
            .get();
        snap.docs.forEach(doc => {
            productsMap[doc.id] = doc.data();
        });
    }

    // שלב 5: קיבוץ orderProducts לפי orderId
    const orderProductsMap = {};
    allOrderProducts.forEach(op => {
        if (!orderProductsMap[op.orderId]) {
            orderProductsMap[op.orderId] = [];
        }
        orderProductsMap[op.orderId].push(op);
    });

    // שלב 6: בניית התוצאה עם הקטגוריות
    const res = orders.docs.map(doc => {
        const docData = doc.data();
        const orderId = doc.id;

        // מציאת כל הקטגוריות ייחודיות עבור ההזמנה הזו
        const orderProducts = orderProductsMap[orderId] || [];
        const uniqueCategories = new Set();

        orderProducts.forEach(op => {
            const product = productsMap[op.productId];
            if (product && product.isQuantityForShipping && op.status === 3) {
                const text = op.quantityOrWeight ? `${op.quantityOrWeight} - ${product.name || ""}` : "";
                uniqueCategories.add(text);
            } else if (product && product.categories && Array.isArray(product.categories)) {
                product.categories.forEach(categoryId => {
                    if (categoriesMap[categoryId]) {
                        uniqueCategories.add(categoriesMap[categoryId]);
                    }
                });
            }
        });

        const collectionGroupOrder = [docData.deliveryIndex || "", docData.collectionGroupOrder || ""].filter(Boolean).join("-");
        const obj = {
            orderId: doc.id,
            nbsOrderId: docData.nbsOrderId,
            collectionGroupOrder,
            fullName: (docData.lastName || "") + "-" + (docData.firstName || ""),
            street: docData.street || "",
            houseNumber: docData.houseNumber || "",
            entrance: docData.entrance || "",
            floor: docData.floor || "",
            apartment: docData.apartment || "",
            phone: docData.phones.join(",") || "",
            notes: Array.from(uniqueCategories), // מערך של שמות קטגוריות ייחודיות
            deliveryIndex: docData.deliveryIndex || null,
            collectionGroupIndex: docData.collectionGroupOrder || "",
            // note: docData.note || "הערה",
            // notes: ["אבטיח", "ביצים", "מוצרי חלב"]
        }

        obj.fullSearch = `${obj.nbsOrderId} ${obj.fullName} ${obj.street} ${obj.phone}`.toLowerCase();
        return obj
    }).sort((a, b) => {
        const aHasDeliveryIndex = a.deliveryIndex !== undefined && a.deliveryIndex !== null;
        const bHasDeliveryIndex = b.deliveryIndex !== undefined && b.deliveryIndex !== null;

        // אם לשניהם יש deliveryIndex - מיון לפי deliveryIndex ואז לפי collectionGroupOrder
        if (aHasDeliveryIndex && bHasDeliveryIndex) {
            if (a.deliveryIndex !== b.deliveryIndex) {
                return a.deliveryIndex - b.deliveryIndex;
            }
            return (a.collectionGroupIndex || 0) - (b.collectionGroupIndex || 0);
        }

        // אם רק ל-a יש deliveryIndex - a קודם
        if (aHasDeliveryIndex && !bHasDeliveryIndex) {
            return -1;
        }

        // אם רק ל-b יש deliveryIndex - b קודם
        if (!aHasDeliveryIndex && bHasDeliveryIndex) {
            return 1;
        }

        // אם לאף אחד אין deliveryIndex - מיון לפי collectionGroupIndex
        return (a.collectionGroupIndex || 0) - (b.collectionGroupIndex || 0);
    })
    return res;
}

const approveOrders = async (orders, isTzintuk, userId) => {
    const batch = db.batch();
    for (const order of orders) {

        batch.update(db.doc('orders/' + order), {
            orderStatus: 5,
            isSentTzintuk: isTzintuk,
            employeeId: userId,
            updateBy: "pos",
            updateDate: Timestamp.now(),
            updateStatus: Timestamp.now(),
        });

        batch.set(db.collection('orderStatuses').doc(), {
            orderId: order,
            orderStatus: 5,
            employeeId: userId,
            updateBy: "pos",
            updateDate: Timestamp.now()
        });

    }
    await batch.commit();
    return true;
}

const getProductsShipping = async (userId) => {
    const orders = await db.collection('orders')
        .where("employeeId", "==", userId)
        .where("orderStatus", "==", 4).get();

    if (orders.empty) {
        return [];
    }
    const orderIds = orders.docs.map(doc => doc.id);

    let allOrderProducts = [];
    for (let i = 0; i < orderIds.length; i += 30) {
        const batch = orderIds.slice(i, i + 30);
        const snap = await db
            .collection('orderProducts')
            .where("orderId", "in", batch)
            .get();
        allOrderProducts.push(...snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }

    const uniqueProductIds = [...new Set(allOrderProducts.map(op => op.productId).filter(Boolean))];

    let productsMap = {};
    for (let i = 0; i < uniqueProductIds.length; i += 30) {
        const batch = uniqueProductIds.slice(i, i + 30);
        const snap = await db
            .collection('products')
            .where("__name__", "in", batch)
            .where("isQuantityForShipping", "==", true)
            .get();
        snap.docs.forEach(doc => {
            productsMap[doc.id] = doc.data();
        });
    }

    // שלב 4: סיכום הכמויות לפי מוצר
    const productQuantityMap = {};

    allOrderProducts.forEach(orderProduct => {
        const product = productsMap[orderProduct.productId];
        if (product) {
            const quantity = orderProduct.quantityOrWeight || 0;
            if (productQuantityMap[orderProduct.productId]) {
                productQuantityMap[orderProduct.productId].quantityOrWeight += quantity;
            } else {
                productQuantityMap[orderProduct.productId] = {
                    id: orderProduct.productId,
                    productName: product.name || orderProduct.productName || '',
                    quantityOrWeight: quantity,
                    productPlace: product.productPlace || '',
                    // unit: product.unit || 'יחידות'
                };
            }
        }
    });

    // שלב 5: המרה למערך ומיון לפי שם המוצר
    const result = Object.values(productQuantityMap)
        .filter(item => item.quantityOrWeight > 0)
        .sort((a, b) => a.productName.localeCompare(b.productName, 'he'));

    return result;
}

const getEmployeesToOrders = async (userId, filterParams) => {
    // שלב 1: שליפת הזמנות עם orderStatus = 2
    const ordersSnap = await db.collection('orders')
        .where("orderStatus", "==", 2)
        .get();

    if (ordersSnap.empty) {
        return [];
    }

    // יצירת מערך של כל ה-IDs של ההזמנות
    const orderIds = ordersSnap.docs.map(doc => doc.id);
    const ordersMap = {};
    ordersSnap.docs.forEach(doc => {
        ordersMap[doc.id] = { id: doc.id, ...doc.data() };
    });

    // שלב 2: שליפת השורות מטבלת הקשר employeesToOrders עם סינון רק ההזמנות במערך
    let empToOrdList = [];
    for (let i = 0; i < orderIds.length; i += 30) {
        const batch = orderIds.slice(i, i + 30);
        const empToOrdSnap = await db.collection('employeesToOrders')
            .where("orderId", "in", batch)
            .get();
        empToOrdList.push(...empToOrdSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }

    if (empToOrdList.length === 0) {
        return [];
    }

    // שלב 3: שליפת כל orderProducts לפי orderIds במנות של 30
    let allOrderProducts = [];
    for (let i = 0; i < orderIds.length; i += 30) {
        const batch = orderIds.slice(i, i + 30);
        const snap = await db
            .collection('orderProducts')
            .where("orderId", "in", batch)
            .get();
        allOrderProducts.push(...snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }

    // שלב 4: שליפת כל הקטגוריות (טבלה קטנה)
    const categoriesSnap = await db.collection('globalProductCategories').get();
    const categoriesMap = {};
    categoriesSnap.docs.forEach(doc => {
        categoriesMap[doc.id] = doc.data().name;
    });

    // שלב 5: איסוף כל productIds ייחודיים מכל ההזמנות
    const uniqueProductIds = [...new Set(allOrderProducts.map(op => op.productId).filter(Boolean))];

    // שלב 6: שליפת כל המוצרים הרלוונטיים במנות של 30
    let productsMap = {};
    if (uniqueProductIds.length > 0) {
        for (let i = 0; i < uniqueProductIds.length; i += 30) {
            const batch = uniqueProductIds.slice(i, i + 30);
            const snap = await db
                .collection('products')
                .where("__name__", "in", batch)
                .get();
            snap.docs.forEach(doc => {
                productsMap[doc.id] = doc.data();
            });
        }
    }

    // שלב 7: איסוף כל מזהי העובדים מהמסמכים (כל employeeId הוא string בודד)
    const employeeIds = [...new Set(
        empToOrdList
            .map(emp => emp.employeeId)
            .filter(Boolean) // כל employeeId הוא string בודד, לא מערך
    )];

    // שלב 8: שליפת כל העובדים במנות של 30
    let employeesMap = {};
    if (employeeIds.length > 0) {
        for (let i = 0; i < employeeIds.length; i += 30) {
            const batch = employeeIds.slice(i, i + 30);
            const empSnap = await db
                .collection('employees')
                .where("__name__", "in", batch)
                .get();
            empSnap.docs.forEach(doc => {
                const empData = doc.data();
                const fullName = (empData.firstName || "") + " " + (empData.lastName || "");
                employeesMap[doc.id] = fullName;
            });
        }
    }

    // שלב 9: קיבוץ orderProducts לפי orderId
    const orderProductsMap = {};
    allOrderProducts.forEach(op => {
        if (!orderProductsMap[op.orderId]) {
            orderProductsMap[op.orderId] = [];
        }
        orderProductsMap[op.orderId].push(op);
    });

    // שלב 10: קיבוץ empToOrdList לפי orderId (כי יכולות להיות מספר שורות לאותה הזמנה)
    const empToOrdByOrderId = {};
    empToOrdList.forEach(empToOrd => {
        if (!empToOrdByOrderId[empToOrd.orderId]) {
            empToOrdByOrderId[empToOrd.orderId] = [];
        }
        empToOrdByOrderId[empToOrd.orderId].push(empToOrd);
    });

    // שלב 11: בניית התוצאה עם כל הנתונים הנדרשים
    const result = [];

    // עבור כל הזמנה, ניצור רשומה אחת עם כל העובדים שלה
    Object.keys(empToOrdByOrderId).forEach(orderId => {
        const order = ordersMap[orderId];
        const orderProducts = orderProductsMap[orderId] || [];
        const empToOrdRecords = empToOrdByOrderId[orderId];

        // חישוב קטגוריות ופריטים
        const uniqueCategories = new Set();
        let totalItems = 0;
        let totalUnits = 0;
        let completedItems = 0; // status = 3 או 4
        let completedUnits = 0;

        orderProducts.forEach(op => {
            const product = productsMap[op.productId];
            const quantity = op.quantityOrWeight || 1;

            // ספירת כלל הפריטים והיחידות
            totalItems++;
            totalUnits += quantity;

            // ספירת פריטים שהושלמו (status = 3 או 4)
            if (op.status === 3 || op.status === 4) {
                completedItems++;
                completedUnits += quantity;
            }

            // איסוף קטגוריות
            if (product && product.isQuantityForShipping && op.status === 3) {
                const text = op.quantityOrWeight ? `${op.quantityOrWeight} - ${product.name || ""}` : "";
                uniqueCategories.add(text);
            } else if (product && product.categories && Array.isArray(product.categories)) {
                product.categories.forEach(categoryId => {
                    if (categoriesMap[categoryId]) {
                        uniqueCategories.add(categoriesMap[categoryId]);
                    }
                });
            }
        });

        // יצירת מערך עובדים כאובייקטים (מכל השורות של אותה הזמנה)
        const employeeObjects = empToOrdRecords.map(empToOrd => ({
            empToOrderId: empToOrd.id, // מזהה הרשומה בטבלת הקשר
            employeeId: empToOrd.employeeId,
            employeeName: employeesMap[empToOrd.employeeId] || "לא נמצא",
            associationDate: empToOrd.associationDate || null,
            isActive: empToOrd.isActive || false
        }));

        result.push({
            orderId: orderId,
            employeeObjects, // מערך של אובייקטים {empToOrderId, employeeName, employeeId, associationDate, isActive}

            // סטטיסטיקות פריטים
            totalItems,
            totalUnits,
            completedItems,
            completedUnits,

            // קטגוריות
            notes: Array.from(uniqueCategories),

            // נתוני ההזמנה
            order: order ? {
                nbsOrderId: order.nbsOrderId,
                fullName: (order.lastName || "") + "-" + (order.firstName || ""),
                street: order.street || "",
                houseNumber: order.houseNumber || "",
                entrance: order.entrance || "",
                floor: order.floor || "",
                apartment: order.apartment || "",
                phone: order.phones ? order.phones.join(",") : "",
                orderStatus: order.orderStatus,
                collectionGroupOrder: order.collectionGroupOrder || "",
                deliveryIndex: order.deliveryIndex || null,
            } : null,

            // שדה חיפוש מרוכב
            fullSearch: order ?
                `${order.nbsOrderId || ""} ${(order.lastName || "") + "-" + (order.firstName || "")} ${order.street || ""} ${order.phones ? order.phones.join(",") : ""} ${employeeObjects.map(emp => emp.employeeName).join(" ")}`.toLowerCase() :
                `${employeeObjects.map(emp => emp.employeeName).join(" ")}`.toLowerCase()
        });
    }); return result;
}

const sendMessage = async (orderId, message, user) => {
    if (orderId) {
        const build = await db.doc('orders/' + orderId).get()
        if (!build.exists) {
            return null;
        }
    }

    await db.collection('orderMessages').add({
        orderId: orderId ? orderId : null,
        message,
        employeeId: user,
        date: Timestamp.now()
    })
    return true;
}

const extractNumber = (val) => {
    if (!val) return Infinity;
    const match = String(val).match(/\d+/);
    return match ? parseInt(match[0], 10) : Infinity;
};



module.exports = {
    login,
    checkUser,
    getProducts,
    approveProducts,
    getOrders,
    approveOrders,
    sendMessage,
    getOrderProducts,
    approveOrderProducts,
    getProductsShipping,
    getEmployeesToOrders
}
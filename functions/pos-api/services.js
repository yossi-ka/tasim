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
        .where("status", "in", [1, 2, 3])
        .get();

    let products = collectionGroupProductsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // מיון products לפי הערך המספרי ב-productPlace
    const extractNumber = (val) => {
        if (!val) return Infinity;
        const match = String(val).match(/\d+/);
        return match ? parseInt(match[0], 10) : Infinity;
    };
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
            color: line ? line.color : null,
        };
    });
    return products;
};

const approveProducts = async (products, userId) => {
    const batch = db.batch();
    for (const product of products) {
        const docRef = db.doc('collectionGroupProducts/' + product);
        batch.update(docRef, {
            status: 2,
            updateBy: "pos",
            updateDate: Timestamp.now(),
            updateStatus: Timestamp.now(),
            collectBy: userId,
        });
    }
    await batch.commit();
    return true;
};

const getOrderProducts = async (userId) => {
    // שלב 1: שליפת כל המוצרים של העובד בעגלה (סטטוס 2)
    const collectionGroupProductsSnap = await db
        .collection('collectionGroupProducts')
        .where("assignedEmployeeId", "==", userId)
        .where("status", "==", 2)
        .get();

    const groupProducts = collectionGroupProductsSnap.docs.map(doc => doc.data());
    if (groupProducts.length === 0) return [];

    // מערך מזהי groupId ו-productId
    const groupIds = [...new Set(groupProducts.map(doc => doc.collectionGroupId).filter(Boolean))];
    const productIds = [...new Set(groupProducts.map(doc => doc.productId).filter(Boolean))];

    // שלב 2: שליפת orderProducts במנות של 30
    let orderProducts = [];
    for (let i = 0; i < groupIds.length; i += 30) {
        const groupBatch = groupIds.slice(i, i + 30);
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
        // const group = groupsMap[op.collectionGroupId] || {};
        // const line = group.lineId ? linesMap[group.lineId] || {} : {};
        return {
            id: op.id,
            productName: op.productName,
            collectionGroupOrder: order.collectionGroupOrder,
            quantityOrWeight: op.quantityOrWeight || 0, // אם אין כמות, נניח 1
            orderId: order.id,
            firstName: order.firstName,
            lastName: order.lastName,
            productPlace: op.productPlace,
            orderProductId: op.id,
            // color: line.color || null
        };
    });

    // מיון לפי collectionGroupOrder ואז לפי productPlace
    const extractNumber = (val) => {
        if (!val) return Infinity;
        const match = String(val).match(/\d+/);
        return match ? parseInt(match[0], 10) : Infinity;
    };

    result.sort((a, b) => {
        const orderA = a.collectionGroupOrder || 0;
        const orderB = b.collectionGroupOrder || 0;
        if (orderA !== orderB) return orderA - orderB;
        // אם אותו collectionGroupOrder, מיין לפי productPlace
        const aNum = extractNumber(a.productPlace);
        const bNum = extractNumber(b.productPlace);
        return aNum - bNum;
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


    const res = orders.docs.map(doc => {
        const docData = doc.data();
        const obj = {
            orderId: doc.id,
            nbsOrderId: docData.nbsOrderId,
            collectionGroupOrder: docData.collectionGroupOrder || 0,
            fullName: (docData.lastName || "") + "-" + (docData.firstName || ""),
            street: docData.street || "",
            houseNumber: docData.houseNumber || "",
            entrance: docData.entrance || "",
            floor: docData.floor || "",
            apartment: docData.apartment || "",
            phone: docData.phones.join(",") || "",
            // note: docData.note || "הערה",
            // notes: ["אבטיח", "ביצים", "מוצרי חלב"]
        }

        obj.fullSearch = `${obj.nbsOrderId} ${obj.fullName} ${obj.street} ${obj.phone}`.toLowerCase();
        return obj
    }).sort((a, b) => {
        return a.collectionGroupOrder - b.collectionGroupOrder;
    })
    return res;
}

const approveOrders = async (orders, userId) => {
    const batch = db.batch();
    for (const order of orders) {

        batch.update(db.doc('orders/' + order), {
            orderStatus: 5,
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




module.exports = {
    login,
    checkUser,
    getProducts,
    approveProducts,
    getOrders,
    approveOrders,
    sendMessage,
    getOrderProducts,
    approveOrderProducts

}
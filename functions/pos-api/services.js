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

const getOrders = async (userId) => {
    const orders = await db.collection('orders')
        .where("employeeId", "==", userId)
        .where("orderStatus", "==", 4).get();
    const res = orders.docs.map(doc => {
        const docData = doc.data();
        const obj = {
            orderId: doc.id,
            nbsOrderId: docData.nbsOrderId,
            fullName: (docData.lastName || "") + "-" + (docData.firstName || ""),
            street: docData.street || "",
            houseNumber: docData.houseNumber || "",
            entrance: docData.entrance || "",
            floor: docData.floor || "",
            apartment: docData.apartment || "",
            phone: docData.phone || "",
            note: docData.note || "",
        }

        obj.fullSearch = `${obj.nbsOrderId} ${obj.fullName} ${obj.street} ${obj.phone}`.toLowerCase();
        return obj
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
    getOrders,
    approveOrders,
    sendMessage
    // getAreas,
    // approveBuild,
    // approveBuilds,
    // getBuildings,
    // sendMessage
}
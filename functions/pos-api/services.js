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
    const role = userData.role || 2;
    return {
        token,
        userName: userFullName,
        role
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



module.exports = {
    login,
    checkUser,
}
const { db } = require('../firebase-config');
const { Timestamp } = require("firebase-admin/firestore");


const errorHandler = async (error, func) => {
    console.error(error)
    await db.collection('errors').add({
        error: JSON.stringify(error),
        func: func,
        time: Timestamp.now()
    });
}
module.exports = { errorHandler };
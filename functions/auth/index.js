const { beforeUserCreated, beforeUserSignedIn, HttpsError } = require("firebase-functions/v2/identity");
const { Timestamp } = require("firebase-admin/firestore");
const { db } = require("../firebase-config");


const beforecreated = beforeUserCreated(async (event) => {
    const user = event.data;
    const email = user.email;
    if (!email) {
        throw new HttpsError('invalid-argument', "Email is required");
    }
    const getUserFromDB = await db.collection('users').where('email', '==', email).get()
    if (getUserFromDB.empty) {
        await db.collection('signInUsers').add({ email: email, ip: event.ipAddress, timestamp: Timestamp.fromDate(new Date()), allowed: false });
        throw new HttpsError('invalid-argument', "User not found");
    }
});

const beforeSignIn = beforeUserSignedIn(async (event) => {
    const user = event.data;
    const email = user.email;
    if (!email) {
        throw new HttpsError('invalid-argument', "Email is required");
    }
    const getUserFromDB = await db.collection('users').where('email', '==', email).get()
    if (getUserFromDB.empty) {
        await db.collection('signInUsers').add({ email: email, ip: event.ipAddress, timestamp: Timestamp.fromDate(new Date()), allowed: false });
        throw new HttpsError('invalid-argument', "User not found");
    } else {
        await db.collection('signInUsers').add({ email: email, ip: event.ipAddress, timestamp: Timestamp.fromDate(new Date()), allowed: true, user: getUserFromDB.docs[0].id });
        return {
            displayName: getUserFromDB.docs[0].id,
        }
    }
});

module.exports = {
    beforecreated,
    beforeSignIn
}

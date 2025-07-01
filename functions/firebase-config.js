const admin = require('firebase-admin');

admin.initializeApp();

const db = admin.firestore();

const storage = admin.storage().bucket();

module.exports = { db, storage };
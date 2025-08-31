const functions = require('firebase-functions');
const messages = require('./messages');
const productPriceUpdate = require('./productPrice');


// יצוא כל תהליכי הרקע של הודעות
exports.messages = messages;
exports.productPriceUpdate = productPriceUpdate;

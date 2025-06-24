const { onRequest } = require('firebase-functions/v2/https');
const auth = require('./auth');

exports.beforeSignIn = auth.beforeSignIn;
exports.beforecreated = auth.beforecreated;

exports.test = onRequest((request, response) => {
    response.send("Hello from test");
});
exports.test2 = onRequest((request, response) => {
    response.send("Hello from test");
});
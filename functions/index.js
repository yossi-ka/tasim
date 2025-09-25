const { onRequest } = require('firebase-functions/v2/https');
const auth = require('./auth');
const posApi = require('./pos-api');
const autoProsses = require('./pos-api/autoProsses');


exports.beforeSignIn = auth.beforeSignIn;
exports.beforecreated = auth.beforecreated;

exports.test = onRequest((request, response) => {
    response.send("Hello from test");
});


exports.posApi = posApi.app;
exports.autoProsses = autoProsses;

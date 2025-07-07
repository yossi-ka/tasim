const { onRequest } = require('firebase-functions/v2/https');
const auth = require('./auth');
const posApi = require('./pos-api');
const autoProsses = require('./pos-api/autoProsses');
const yemotMsg = require('./yemot-msg');
const backgroundProcesses = require('./background-processes');
const { refreshOrders } = require('./nbs-api');

exports.beforeSignIn = auth.beforeSignIn;
exports.beforecreated = auth.beforecreated;

exports.test = onRequest((request, response) => {
    response.send("Hello from test");
});
exports.test2 = onRequest((request, response) => {
    refreshOrders()
    response.send("Hello from test");
});

exports.posApi = posApi.app;
exports.autoProsses = autoProsses;

exports.yemotMsg = yemotMsg;

// תהליכי רקע
exports.backgroundProcesses = backgroundProcesses;
// exports.onMessageUpdated = backgroundProcesses.messages.onMessageUpdated;
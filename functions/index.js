const { onRequest } = require('firebase-functions/v2/https');
const auth = require('./auth');
const posApi = require('./pos-api');
const autoProsses = require('./pos-api/autoProsses');
const yemotMsg = require('./yemot-msg');
const backgroundProcesses = require('./background-processes');
const { refreshOrders } = require('./nbs-api');
const refreshOrdersV2 = require('./nbs-api/importOrdersEndpoint');

exports.beforeSignIn = auth.beforeSignIn;
exports.beforecreated = auth.beforecreated;

exports.test = onRequest((request, response) => {
    response.send("Hello from test");
});
exports.test2 = onRequest(
    {
        memory: "8GiB",
        cpu: 4,
        timeoutSeconds: 540,
        maxInstances: 1,
        concurrency: 1
    },
    async (request, response) => {
        await refreshOrders()
        response.send("Hello from test");
    });


exports.test3 = onRequest(
    {
        memory: "8GiB",
        cpu: 4,
        timeoutSeconds: 540,
        maxInstances: 1,
        concurrency: 1
    },
    async (request, response) => {
        try {

            const authHeader = request.headers.authorization;
            if (!authHeader || authHeader !== "Bearer fromNodeService") {
                response.status(401).send("Unauthorized: Missing or invalid token");
                return;
            }

            const ordersData = request.body;

            if (!ordersData || !Array.isArray(ordersData)) {
                response.status(400).send("Invalid data: Expected array of orders");
                return;
            }

            console.log(`📦 Received ${ordersData.length} orders for import`);

            const result = await refreshOrdersV2.importOrdersFromJson(ordersData, "api-import");

            response.status(200).json({
                success: true,
                message: "Orders imported successfully",
                ...result
            });

        } catch (error) {
            console.error('💥 Error in test3 endpoint:', error.message);
            response.status(500).json({
                success: false,
                error: error.message
            });
        }
    });


exports.lastOrderImportDate = onRequest(async (request, response) => {
    try {
        const lastImportDate = await refreshOrdersV2.getLastOrderImportDate();
        response.status(200).json({
            success: true,
            lastImportDate: lastImportDate
        });
    } catch (error) {
        console.error('💥 Error in lastOrderImportDate endpoint:', error.message);
        response.status(500).json({
            success: false,
            error: error.message
        });
    }
});
exports.posApi = posApi.app;
exports.autoProsses = autoProsses;

exports.yemotMsg = yemotMsg;

// תהליכי רקע
exports.backgroundProcesses = backgroundProcesses;
// exports.onMessageUpdated = backgroundProcesses.messages.onMessageUpdated;
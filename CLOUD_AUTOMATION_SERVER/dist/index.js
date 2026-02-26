"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const firebase_1 = require("./config/firebase");
const listener_1 = require("./telegram/listener");
const subscriptionService_1 = require("./services/subscriptionService");
const metaApiIntegration_1 = require("./trading/metaApiIntegration");
console.log('SoftiBridge Cloud Automation Server Starting...');
const app = (0, express_1.default)();
exports.app = app;
const PORT = process.env.PORT || 3000;
app.get('/', (req, res) => {
    res.status(200).send('OK');
});
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});
try {
    (0, firebase_1.initializeFirebase)();
    console.log('Firebase Admin SDK initialized successfully');
}
catch (error) {
    console.error('Failed to initialize Firebase:', error);
}
async function processSignal(signal) {
    console.log(`Processing signal from source: ${signal.sourceChatId}`);
    try {
        const clients = await (0, subscriptionService_1.getAllActiveClientsForSignal)(signal);
        if (clients.length === 0) {
            console.log('No active clients found for this signal source');
            return;
        }
        console.log(`Found ${clients.length} active clients to process`);
        for (const task of clients) {
            console.log(`- Client: ${task.client.accountNumber} on ${task.client.brokerServer}`);
        }
        console.log('Starting parallel trade execution...');
        const results = await (0, metaApiIntegration_1.executeBatchTrades)(clients, signal);
        const successful = results.filter(r => r.success).length;
        const failed = results.filter(r => !r.success).length;
        console.log(`Trade execution complete: ${successful} successful, ${failed} failed`);
        for (const result of results) {
            if (!result.success) {
                console.log(`Failed for ${result.client.accountNumber}: ${result.errorReason}`);
            }
        }
    }
    catch (error) {
        console.error('Error processing signal:', error);
    }
}
(0, listener_1.onSignal)(async (signal) => {
    console.log('=== SIGNAL RECEIVED ===');
    console.log(JSON.stringify(signal, null, 2));
    console.log('========================');
    await processSignal(signal);
});
(0, listener_1.startListener)();
app.listen(PORT, () => {
    console.log(`SoftiBridge Cloud Automation Server Started on port ${PORT}`);
    console.log(`Keep-alive endpoint available at http://localhost:${PORT}/`);
});
//# sourceMappingURL=index.js.map
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getActiveAccountsForSource = getActiveAccountsForSource;
exports.getAllActiveClientsForSignal = getAllActiveClientsForSignal;
const firebase_1 = require("../config/firebase");
async function decryptPassword(encryptedPassword) {
    const encryptionKey = process.env.ENCRYPTION_KEY;
    if (!encryptionKey) {
        throw new Error('Encryption key not configured');
    }
    const crypto = require('crypto');
    const key = crypto.scryptSync(encryptionKey, 'salt', 32);
    const iv = Buffer.from(encryptedPassword.slice(0, 32), 'hex');
    const encrypted = Buffer.from(encryptedPassword.slice(32), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}
async function getActiveAccountsForSource(signalSourceId) {
    const firestore = (0, firebase_1.getFirestore)();
    const tradeClients = [];
    try {
        let usersSnapshot = await firestore.collection('users')
            .where('licenseStatus', '==', 'ACTIVE')
            .where('allowed_signal_source', '==', signalSourceId)
            .get();
        // If no users matched the explicit strict channel, check if it's a private chat test
        if (usersSnapshot.empty) {
            usersSnapshot = await firestore.collection('users')
                .where('licenseStatus', '==', 'ACTIVE')
                .where('telegramChatId', '==', signalSourceId)
                .get();
            if (!usersSnapshot.empty) {
                console.log(`Executing private test signal for user ID matching ${signalSourceId} chat`);
            }
        }
        for (const userDoc of usersSnapshot.docs) {
            try {
                const userData = userDoc.data();
                if (!userData.tradingAccount) {
                    console.log(`User ${userDoc.id} has no trading account configured`);
                    continue;
                }
                let decryptedPassword = userData.tradingAccount.password;
                if (userData.tradingAccount.passwordEncrypted) {
                    try {
                        decryptedPassword = await decryptPassword(userData.tradingAccount.password);
                    }
                    catch (decryptError) {
                        console.error(`Failed to decrypt password for user ${userDoc.id}:`, decryptError);
                        continue;
                    }
                }
                const client = {
                    userId: userDoc.id,
                    accountNumber: userData.tradingAccount.accountNumber,
                    brokerServer: userData.tradingAccount.brokerServer,
                    password: decryptedPassword,
                    riskPercentage: userData.tradingAccount.riskPercentage,
                    fixedLots: userData.tradingAccount.fixedLots,
                    allowedSignalSource: userData.allowed_signal_source,
                    telegramChatId: userData.telegramChatId,
                };
                tradeClients.push(client);
            }
            catch (error) {
                console.error(`Error processing user ${userDoc.id}:`, error);
                continue;
            }
        }
    }
    catch (error) {
        console.error('Error fetching active accounts:', error);
        throw error;
    }
    return tradeClients;
}
async function getAllActiveClientsForSignal(signal) {
    const clients = await getActiveAccountsForSource(signal.sourceChatId);
    return clients.map(client => ({ client, signal }));
}
//# sourceMappingURL=subscriptionService.js.map
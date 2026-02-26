"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const admin = __importStar(require("firebase-admin"));
const fs = __importStar(require("fs"));
const serviceAccount = JSON.parse(fs.readFileSync('../ultra-signal-2026-v1-firebase-adminsdk-fbsvc-3b55b68193.json', 'utf8'));
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
});
const db = admin.firestore();
async function findUserLicense() {
    try {
        const users = await db.collection('users').get();
        let targetUserId = null;
        for (const doc of users.docs) {
            const data = doc.data();
            if (data.tradingAccount) {
                targetUserId = doc.id;
                console.log(`Found user ID: ${targetUserId} with trading account configured!`);
                break;
            }
        }
        if (targetUserId) {
            const licenses = await db.collection('licenses').where('userId', '==', targetUserId).get();
            if (!licenses.empty) {
                licenses.docs.forEach(doc => {
                    console.log(`License found: ${doc.data().licenseKey} | Status: ${doc.data().status}`);
                });
            }
            else {
                console.log('No licenses found for this user. Creating a test license...');
                const testKey = 'SB-TEST-1234-ABCD';
                await db.collection('licenses').add({
                    userId: targetUserId,
                    licenseKey: testKey,
                    status: 'ACTIVE',
                    productName: 'SoftiBridge Pro Test',
                    createdAt: new Date(),
                    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                });
                await db.collection('users').doc(targetUserId).update({
                    licenseStatus: 'ACTIVE'
                });
                console.log(`Created test license: ${testKey}`);
            }
        }
        else {
            console.log('Could not find user in database by those emails.');
        }
    }
    catch (e) {
        console.error(e);
    }
    finally {
        process.exit(0);
    }
}
findUserLicense();
//# sourceMappingURL=debug_license.js.map
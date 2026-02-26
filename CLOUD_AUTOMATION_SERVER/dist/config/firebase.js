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
exports.admin = void 0;
exports.initializeFirebase = initializeFirebase;
exports.getFirestore = getFirestore;
const admin = __importStar(require("firebase-admin"));
exports.admin = admin;
const fs = __importStar(require("fs"));
let firestore;
function initializeFirebase() {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    let serviceAccount;
    const privateKeyPath = process.env.FIREBASE_PRIVATE_KEY_PATH;
    if (privateKeyPath && fs.existsSync(privateKeyPath)) {
        const serviceAccountFile = JSON.parse(fs.readFileSync(privateKeyPath, 'utf8'));
        serviceAccount = {
            projectId: serviceAccountFile.project_id,
            clientEmail: serviceAccountFile.client_email,
            privateKey: serviceAccountFile.private_key,
        };
    }
    else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    }
    else {
        throw new Error('Firebase credentials not provided. Set FIREBASE_PRIVATE_KEY_PATH or FIREBASE_SERVICE_ACCOUNT environment variable.');
    }
    if (!admin.apps.length) {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: projectId,
        });
    }
    return admin.app();
}
function getFirestore() {
    if (!firestore) {
        initializeFirebase();
        firestore = admin.firestore();
    }
    return firestore;
}
//# sourceMappingURL=firebase.js.map
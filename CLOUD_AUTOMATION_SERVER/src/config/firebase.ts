import * as admin from 'firebase-admin';
import * as fs from 'fs';
import * as path from 'path';

let firestore: admin.firestore.Firestore;

function initializeFirebase(): admin.app.App {
  const projectId = process.env.FIREBASE_PROJECT_ID;

  let serviceAccount: admin.ServiceAccount;

  const privateKeyPath = process.env.FIREBASE_PRIVATE_KEY_PATH;

  if (privateKeyPath && fs.existsSync(privateKeyPath)) {
    const serviceAccountFile = JSON.parse(fs.readFileSync(privateKeyPath, 'utf8'));
    serviceAccount = {
      projectId: serviceAccountFile.project_id,
      clientEmail: serviceAccountFile.client_email,
      privateKey: serviceAccountFile.private_key,
    };
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
  } else {
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

function getFirestore(): admin.firestore.Firestore {
  if (!firestore) {
    initializeFirebase();
    firestore = admin.firestore();
  }
  return firestore;
}

export { initializeFirebase, getFirestore, admin };

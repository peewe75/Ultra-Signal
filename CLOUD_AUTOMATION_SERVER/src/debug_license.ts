import * as admin from 'firebase-admin';
import * as fs from 'fs';

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
            } else {
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
        } else {
            console.log('Could not find user in database by those emails.');
        }
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

findUserLicense();

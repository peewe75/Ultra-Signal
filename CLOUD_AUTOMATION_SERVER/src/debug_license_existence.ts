import 'dotenv/config';
import { getFirestore } from './config/firebase';

async function checkLicense() {
    const db = getFirestore();
    const key = 'SB-WF96-B0IV-GOJS';

    console.log('Checking license:', key);

    const snap1 = await db.collection('licenses').where('licenseKey', '==', key).get();
    console.log('Found in global licenses (licenseKey):', snap1.size);
    if (snap1.size > 0) {
        console.log('Data:', snap1.docs[0].data());
    }

    const snap2 = await db.collection('licenses').where('license_key', '==', key).get();
    console.log('Found in global licenses (license_key):', snap2.size);

    // Also check users subcollections
    const users = await db.collection('users').get();
    for (const userDoc of users.docs) {
        const userLic = await userDoc.ref.collection('licenses').where('license_key', '==', key).get();
        if (userLic.size > 0) {
            console.log('Found in user', userDoc.id, 'subcollection');
            console.log('Data:', userLic.docs[0].data());
        }
    }
}

checkLicense().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });

import "dotenv/config";
import { getFirestore } from './config/firebase';

async function checkAllProfiles() {
    const firestore = getFirestore();
    const usersRef = firestore.collection('users');
    const userSnapshot = await usersRef.where('telegramChatId', '==', '8203155688').get();

    if (userSnapshot.empty) {
        console.log('No users found.');
        return;
    }

    console.log(`Found ${userSnapshot.docs.length} users with this Telegram ID.`);
    userSnapshot.docs.forEach((doc, idx) => {
        console.log(`\n--- User ${idx + 1} | ID: ${doc.id} ---`);
        const data = doc.data();
        console.log(`Email: ${data.email || 'N/A'}`);
        console.log(`Allowed Source: ${data.allowed_signal_source}`);
        console.log(`License Status: ${data.licenseStatus}`);
        console.log(`Has Trading Account: ${!!data.tradingAccount}`);
    });
}

checkAllProfiles().catch(console.error);

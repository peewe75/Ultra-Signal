"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const firebase_1 = require("./config/firebase");
async function checkUserProfile() {
    const firestore = (0, firebase_1.getFirestore)();
    const usersRef = firestore.collection('users');
    const userSnapshot = await usersRef.where('telegramChatId', '==', '8203155688').get();
    if (userSnapshot.empty) {
        console.log('No user found with telegramChatId 8203155688');
        return;
    }
    const userDoc = userSnapshot.docs[0];
    console.log('User Profile Data:', JSON.stringify(userDoc.data(), null, 2));
}
checkUserProfile().catch(console.error);
//# sourceMappingURL=debug_user.js.map
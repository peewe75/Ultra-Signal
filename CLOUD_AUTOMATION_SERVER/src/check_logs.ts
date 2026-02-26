
import { getFirestore } from './config/firebase';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

async function checkLogs() {
    try {
        const db = getFirestore();
        console.log("Checking last 5 trade logs...");
        const snap = await db.collection('trade_logs').orderBy('timestamp', 'desc').limit(5).get();
        if (snap.empty) {
            console.log("No logs found.");
            return;
        }
        snap.forEach((doc: any) => {
            console.log("ID:", doc.id);
            const data = doc.data();
            console.log("Timestamp:", data.timestamp?.toDate()?.toLocaleString() || 'N/A');
            console.log("Results Summary:");
            data.results?.forEach((r: any) => {
                console.log(` - Account: ${r.accountNumber}, Success: ${r.success}, Error: ${r.errorReason || 'None'}`);
            });
        });
    } catch (e) {
        console.error("Error:", e);
    }
}

checkLogs().then(() => process.exit(0));

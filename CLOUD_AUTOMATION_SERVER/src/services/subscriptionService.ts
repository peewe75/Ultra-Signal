import { getFirestore } from '../config/firebase';
import { TradeSignal } from '../telegram/parser';

export interface TradeClient {
  userId: string;
  accountNumber: string;
  brokerServer: string;
  password: string;
  riskPercentage?: number;
  fixedLots?: number;
  allowedSignalSource: string;
  telegramChatId?: string;
}

export interface TradeTask {
  client: TradeClient;
  signal: TradeSignal;
}

async function decryptPassword(encryptedPassword: string): Promise<string> {
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

export async function getActiveAccountsForSource(signalSourceId: string): Promise<TradeClient[]> {
  const firestore = getFirestore();
  const tradeClients: TradeClient[] = [];

  try {
    // Find users who have this signal source allowed
    let usersSnapshot = await firestore.collection('users')
      .where('allowed_signal_source', '==', signalSourceId)
      .get();

    // If no users matched the explicit strict channel, check if it's a private chat test
    if (usersSnapshot.empty) {
      console.log(`No explicit matches for source ID: ${signalSourceId}, checking telegramChatId matching...`);
      usersSnapshot = await firestore.collection('users')
        .where('telegramChatId', '==', signalSourceId)
        .get();
    }

    if (usersSnapshot.empty) {
      // Also check for bot username matches if they put the bot name as source
      const botMe = await firestore.collection('config').doc('bot').get();
      const botUsername = botMe.exists ? botMe.data()?.username : '@BCSAIVIP_bot';

      if (signalSourceId === botUsername) {
        console.log('Signal came from bot itself or private chat, checking all users with matching ChatId...');
      }
    }

    for (const userDoc of usersSnapshot.docs) {
      try {
        const userData = userDoc.data();

        // CHECK LICENSE: Either top-level flag or subcollection
        const isLicenseActive = userData.licenseStatus === 'ACTIVE' ||
          userData.license_status === 'ACTIVE';

        if (!isLicenseActive) {
          // Double check subcollection to be sure
          const licSnap = await userDoc.ref.collection('licenses')
            .where('status', '==', 'ACTIVE')
            .limit(1)
            .get();

          if (licSnap.empty) {
            console.log(`User ${userDoc.id} has no active license found.`);
            continue;
          }
        }

        if (!userData.tradingAccount) {
          console.log(`User ${userDoc.id} has no trading account configured`);
          continue;
        }

        let decryptedPassword = userData.tradingAccount.password;

        if (userData.tradingAccount.passwordEncrypted) {
          try {
            decryptedPassword = await decryptPassword(userData.tradingAccount.password);
          } catch (decryptError) {
            console.error(`Failed to decrypt password for user ${userDoc.id}:`, decryptError);
            continue;
          }
        }

        const client: TradeClient = {
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

      } catch (error) {
        console.error(`Error processing user ${userDoc.id}:`, error);
        continue;
      }
    }

  } catch (error) {
    console.error('Error fetching active accounts:', error);
    throw error;
  }

  return tradeClients;
}

export async function getAllActiveClientsForSignal(signal: TradeSignal): Promise<TradeTask[]> {
  const clients = await getActiveAccountsForSource(signal.sourceChatId);
  return clients.map(client => ({ client, signal }));
}

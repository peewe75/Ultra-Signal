import 'dotenv/config';
import express from 'express';
import { initializeFirebase } from './config/firebase';
import { startListener, onSignal } from './telegram/listener';
import { TradeSignal } from './telegram/parser';
import { getAllActiveClientsForSignal, TradeTask } from './services/subscriptionService';
import { executeBatchTrades, TradeResult } from './trading/metaApiIntegration';


console.log('SoftiBridge Cloud Automation Server Starting...');

const app = express();
const PORT = process.env.PORT || 3001;

app.get('/', (req, res) => {
  res.status(200).send('OK');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

try {
  initializeFirebase();
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
}

async function processSignal(signal: TradeSignal): Promise<void> {
  console.log(`Processing signal from source: ${signal.sourceChatId}`);

  try {
    const clients: TradeTask[] = await getAllActiveClientsForSignal(signal);

    if (clients.length === 0) {
      console.log('No active clients found for this signal source');
      return;
    }

    console.log(`Found ${clients.length} active clients to process`);

    for (const task of clients) {
      console.log(`- Client: ${task.client.accountNumber} on ${task.client.brokerServer}`);
    }

    console.log('Starting parallel trade execution...');
    const results: TradeResult[] = await executeBatchTrades(clients, signal);

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`Trade execution complete: ${successful} successful, ${failed} failed`);

    for (const result of results) {
      if (!result.success) {
        console.log(`Failed for ${result.client.accountNumber}: ${result.errorReason}`);
      }
    }

  } catch (error) {
    console.error('Error processing signal:', error);
  }
}

onSignal(async (signal: TradeSignal) => {
  console.log('=== SIGNAL RECEIVED ===');
  console.log(JSON.stringify(signal, null, 2));
  console.log('========================');

  await processSignal(signal);
});

startListener();

app.listen(PORT, () => {
  console.log(`SoftiBridge Cloud Automation Server Started on port ${PORT}`);
  console.log(`Keep-alive endpoint available at http://localhost:${PORT}/`);
});

export { app };

# Fase 4: Trading Execution Engine (Integrazione API Cloud)

**Obiettivo della Fase:**
Collegare il nosto "Server Cloud Automation" all'infrastruttura di trading reale (es. `MetaApi.cloud` o Provider Server-to-Server equivalente). Dopo che la Fase 3 ha fornito l'Array di clienti autorizzati, dobbiamo tradurre il Segnale in un Ordine Market sulle loro Piattaforme MT4 o MT5 in millisecondi.

## Dettagli di Sviluppo Richiesti

1. **Il Modulo di Trading Api (Esecuzione Ordini)**
   - Crea un file `src/trading/metaApiIntegration.ts` (o nome affine all'SDK Cloud scelto).
   - Inizializza l'SDK ufficiale MetaApi o il servizio REST HTTP configurato.
   - Crea una classe/funzione `executeBatchTrades(clients: TradeClient[], signal: TradeSignal)`.
   - Per ciascun `client` contenuto nell'Array, la funzione dovrà stabilire una connessione (se non in cache) all'ID MT4/MT5 e piazzare l'ordine Buy/Sell Limit.

2. **Logica di Lottaggio/Rischio (Posizionamento Dimensioni)**
   - Definisci una logica su come il software deve calcolare la dimensione in LOTS.
   - Questa logica può essere pescata dalla configurazione dell'utente (`client.riskPercentage` oppure `client.fixedLots`) estrapolata sempre da Firebase.
   - Evita lottaggi statici "hard-coded" per non far saltare conti con Balance minori.

3. **Inoltro Parallelo (Velocità ed Efficienza)**
   - L'esecuzione non deve essere puramente sequenziale (Evita loop lenti se hai 50 clienti, perché il cliente `n=50` entrerebbe a mercato 20 secondi dopo il cliente `n=1` subendo letale slippage).
   - Usa `Promise.allSettled()` o sistemi code parallele asincrone per sparare a mercato tutti i clienti in modalità batch o pseudo-simultanea.
   - Gestisci accuratamente i "Rejects". Se l'Account #012 restituisce "Invalid Password" o "Account non coperto", lo script non deve assolutamente bloccare l'invio degli ordini per l'Account #013.

4. **Tracciamento Log di Successo su Firestore**
   - Una volta che `Promise.allSettled` risponde, scrivi un sommario log nella collection Firestore `trade_logs` contenente: `timestamp`, `segnale`, `numeroAccount`, `risultato(OK/Error)`, `ErrorReason (se fallito)`. Questo servirà all'assistenza clienti SoftiBridge per i problemi operativi.

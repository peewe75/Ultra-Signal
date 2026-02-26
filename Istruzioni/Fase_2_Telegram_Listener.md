# Fase 2: Telegram Signal Listener e Parsing

**Obiettivo della Fase:**
Aggiungere al "Cloud Automation Server" le capacità di ascolto in tempo reale dei messaggi provenienti da Gruppi o Canali Telegram e l'estrazione intelligente dei metadati vitali del trade (Symbol, Buy/Sell, Entry, Stop Loss, Take Profit).

## Dettagli di Sviluppo Richiesti

1. **Telegram Listener (Connessione Bot)**
   - Crea un file `src/telegram/listener.ts`.
   - Utilizza una libreria (es. `node-telegram-bot-api` o `telegraf`) per connettere il BOT UFFICIALE SOFTIBRIDGE.
   - Il Bot deve ascoltare tutti i messaggi in ingresso usando `bot.on('message', ...)`.
   - *Nota Architetturale Confermata (Metodo A):* Questo Bot verrà inserito come Amministratore nelle Sale Segnali ("Master Channels") dai creatori dei segnali stessi, permettendogli di leggere liberamente tutti i messaggi postati.

2. **Estrazione e Parsing (Il Cuore dell'Algoritmo)**
   - Crea un file `src/telegram/parser.ts`.
   - Implementa un parser RegEx robusto in grado di processare e destrutturare i messaggi di segnale.
   - Deve identificare con precisione:
     - `SIDE` (es. BUY, SELL, BUY LIMIT, SELL STOP)
     - `SYMBOL` (es. XAUUSD, EURJPY, US30)
     - `ENTRY PRICE` (il prezzo di ingresso o "@ prezzo limite")
     - `SL` (Stop Loss)
     - `TP1`, `TP2`, `TP3` (Take Profits Multipli).
   - Deve ignorare messaggi "spazzatura" (es. "Buongiorno ragazzi", "Profitto preso!").
   - Se il segnale è valido, il parser deve restituire un oggetto strutturato (es. un'interfaccia TypeScript `TradeSignal` contenente tutti i campi estratti e l'`ID` del canale di provenienza).

3. **Integrazione Index**
   - Importa e avvia il Listener all'interno di `index.ts`.
   - Inserisci un semplice `console.log(signalObject)` ogni volta che un segnale viene validato per facilitare il testing iniziale.

4. **Interazione Utente (Attivazione Licenza e WOW Effect)**
   - Il Bot non deve limitarsi ad ascoltare le sale (Master Channels), ma deve **anche interfacciarsi privatamente con i clienti**.
   - Implementa un ascoltatore per chat private (es. catturando il comando `/start` o un semplice testo) in cui l'utente invia e incolla la sua **License Key** (es. `SB-...`).
   - Il Bot interroga Firestore per validare la Licenza. Se è `ACTIVE`, il Bot associa il `chat_id` Telegram dell'utente al suo profilo Dashboard su Firestore e risponde: *"✅ Configurazione Completata! Il tuo Account è collegato, funzionerà tutto in automatico."*
   - Questa fase regala all'utente l'esperienza "chiavi in mano" e permette in futuro di inviargli notifiche dei trade aperti direttamente in DM.

**Vincoli Cruciali:**

- Il Listener deve anche registrare da *quale* Chat ID (Canale o Gruppo) proviene il messaggio. Questo campo è vitale per la Fase 3, perché consentirà di smistare il segnale unicamente ai clienti sintonizzati su quella specifica Sala Segnali.

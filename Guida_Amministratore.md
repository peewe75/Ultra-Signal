# 👑 Guida Ufficiale Amministratore (Admin) - BCS AI Cloud

Questa guida è destinata esclusivamente agli amministratori del sistema BCS AI Cloud. Contiene le procedure operative per configurare il server, gestire l'abbonamento degli utenti e monitorare le operazioni automatiche.

---

## 🏗️ 1. Avvio e Gestione del Cloud Server

Il server di automazione è il cuore pulsante del sistema. Si occupa di ricevere i segnali da Telegram e smistarli ai conti degli utenti tramite API.

### Prerequisiti

Prima di avviare il server, assicurati che il file `.env` sia configurato correttamente nella cartella `CLOUD_AUTOMATION_SERVER`. Deve contenere:

- Le credenziali del tuo Bot Telegram (`TELEGRAM_BOT_TOKEN`)
- Le credenziali del progetto Firebase (`FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY`)
- Il Token per le API di Trading Cloud (es. `METAAPI_TOKEN`)
- Una chiave di crittografia sicura a 32 caratteri (`ENCRYPTION_KEY`)

### Avvio in Produzione

Per avviare il server in ambiente di produzione (es. su una VPS dedicata o un servizio Cloud come Heroku/Render):

1. Naviga nella cartella del server.
2. Esegui la compilazione TypeScript (se non già fatta): `npm run build`
3. Avvia il server: `npm start`

Il server resterà in ascolto 24/7. Si consiglia l'uso di un gestore di processi come `pm2` per assicurare il riavvio automatico in caso di crash (`pm2 start dist/index.js --name "BCS-AI-Cloud"`).

---

## 🤖 2. Configurazione del Bot Telegram e Canali Segnali

Il sistema utilizza il metodo "Bot in Master Channel" per catturare i segnali.

1. **Creazione Bot:** Se non lo hai ancora fatto, crea un bot tramite [@BotFather](https://t.me/BotFather) su Telegram e ottieni il Token.
2. **Accesso ai Canali:** Aggiungi il tuo Bot (es. `@BCSAI_Bot`) come **Amministratore** a tutti i canali Telegram VIP da cui desideri prelevare i segnali. Il bot deve avere i permessi per leggere i messaggi.
3. **Identificativo Sorgente:** Ogni canale Telegram ha un ID numerico (es. `-1001234567890`) o un username (es. `@SegnaliVIP`). Assicurati di comunicare questo identificativo ai tuoi clienti, poiché dovranno inserirlo nella loro Web Dashboard alla voce "Sorgente Segnali".

---

## 👥 3. Gestione Utenti e Licenze (Web Dashboard Admin)

Dal pannello di controllo Admin della Web Dashboard (accedendo con l'email: `peewe75@gmail.com`), hai il controllo totale sugli abbonati.

### Ciclo di vita della Licenza

1. **Generazione:** Quando un utente acquista un abbonamento (es. tramite Stripe), il sistema genera automaticamente una `License Key` e la imposta su stato `ACTIVE` nel database (Firestore).
2. **Revoca/Scadenza:** Se un abbonamento scade o viene annullato, la licenza passerà a stato `INACTIVE`.
   - **IMPORTANTE:** Il Cloud Server **ignorerà automaticamente** tutti gli utenti con licenza non attiva. I loro conti non riceveranno più operazioni, anche se il canale genera segnali.
3. **Modifica Manuale:** Puoi forzare lo stato di una licenza (Attivare, Sospendere, Revocare) direttamente dal pannello Admin, oppure direttamente nel database Firebase Firestore (collezione `licenses`).

---

## 🩺 4. Monitoraggio e Troubleshooting

### Verifica Operazioni (Log dei Trade)

Tutte le operazioni processate dal Cloud Server vengono registrate in tempo reale.

- **Dove:** Nel database Firestore, all'interno della collezione `trade_logs`.
- **Cosa troverai:** Ogni record conterrà l'ID del segnale, l'esito per ogni utente (Successo o Errore), l'ID dell'ordine (se applicabile), eventuali messaggi di errore (es. "Fondi insufficienti", "Lotto troppo piccolo", "Credenziali MT4 errate") e ovviamente il simbolo/prezzo dell'operazione.

### Problemi Comuni degli Utenti

- **L'utente non riceve i segnali:**
  1. Verifica nel pannello Admin che la sua licenza sia `ACTIVE`.
  2. Dalla Web Dashboard dell'utente, verifica che la "Sorgente Segnali" configurata coincida esattamente con l'ID/Username del canale master monitorato dal Bot.
  3. Verifica che il Bot Telegram gli abbia confermato la connessione (l'utente deve aver inviato al bot la propria chiavetta `BCS-XXX-XXX`).
  4. Controlla i `trade_logs` in Firestore per vedere se c'è un errore specifico per quel numero di conto (es. password errata).

- **Cambio Fornitore Segnali o Formato Messaggi:**
  Se il fornitore dei segnali cambia il formato dei messaggi in cui scrive BUY/SELL, potrebbe essere necessario aggiornare le RegEx nel file `CLOUD_AUTOMATION_SERVER/src/telegram/parser.ts` e riavviare il server.

---

## 🔒 5. Sicurezza e Password MT4/MT5

Le password MT4/MT5 degli utenti sono **estremamente sensibili**.

- Il sistema le cripta dal momento dell'inserimento nella Web Dashboard e le salva cifrate in modo incomprensibile nel database Firestore.
- L'unica entità in grado di decifrarle è il Cloud Server, utilizzando la `ENCRYPTION_KEY` impostata nel file `.env`.
- **MAI perdere o condividere la `ENCRYPTION_KEY`**. Se viene cambiata, tutte le password salvate andranno perse e gli utenti dovranno reinserirle dalla dashboard.

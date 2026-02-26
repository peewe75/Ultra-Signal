# Fase 3: Routing Segnali tramite Firebase (Validazione Licenze e Match Sorgenti)

**Obiettivo della Fase:**
Una volta che il `parser.ts` ha identificato ed estratto un Segnale Valido proveniente da un Canale Telegram (es. `ChatID: -100999999`), dobbiamo sapere verso quali clienti instradare quel segnale.

## Dettagli di Sviluppo Richiesti

1. **Il Servizio di Abbonamenti (SubscriptionService)**
   - Crea un file nell'architettura del Cloud Server: `src/services/subscriptionService.ts`.
   - Implementa una funzione (es. `getActiveAccountsForSource(signalSourceId: string)`) che interroga Firestore.

2. **Le Query di Matching (Filtri Essenziali)**
   - Effettua una lettura al database per isolare gli Utenti che devono ricevere e processare questo trade.
   - *Condizione 1:* L'utente deve avere sul Cloud uno stato Licenza Attivo (es. `status == 'ACTIVE'`). Exclude gli utenti `EXPIRED`, `REVOKED`, `SUSPENDED`.
   - *Condizione 2:* Il canale di provenienza del Segnale (letto su Telegram in Fase 2) DEVE COMBACIARE con il canale autorizzato configurato nel profilo utente (es. campo Firestore: `allowed_signal_source == signalSourceId`).

3. **Recupero Credenziali Trading Account**
   - Una volta filtrati gli utenti idonei, per ognuno di essi mappa ed estrai i dati del conto trading (`accountNumber`, `brokerServer`, `password`).
   - Assicurati che lo scraping Firebase di questi dati sia sicuro e decriptato sul momento (se avete previsto meccanismi di encrypt a riposo per le password MT4/MT5 su Firestore, gestiscili qui).
   - Restituisci un Array di oggetti contenente il "Trade da Eseguire" unito ai "Dati del Cliente da usare per l'accesso".

**Vincoli Cruciali:**

- Performance: Le chiamate a Firestore non devono essere troppo lunghe. Inoltra il payload il prima possibile alla Fase 4 per abbattere la latenza (slippage) del trade d'ingresso.
- Non bloccare MAI il flow generale per un singolo record corrotto su Firebase. Usa `try/catch` per isolare il cliente "fallato" loggando l'errore senza interferire sull'array globale.

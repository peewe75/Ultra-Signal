# Fase 5: Modifica Interfaccia Utente (Web Dashboard Frontend)

**Obiettivo della Fase:**
Lavorare sul codice sorgente dell'attuale `Web Dashboard` situato nella cartella `web-dashboard`.
Aggiungeremo la possibilità per gli utenti di inserire autonomamente le loro credenziali Trading ed il link/ID della Sala Segnali a cui desiderano "attaccarsi". Questo senza toccare il motore delle Licenze (pagamenti, sospensioni scadenze) che funziona perfettamente.

## Dettagli di Sviluppo Richiesti

1. **Creazione di una Nuova Pagina "Configurazione Auto-Trading"**
   - Intercetta o crea un percorso (es. `src/app/dashboard/autotrading/page.tsx` o un Modale/Pop-up analogo nell'area utenti React/Next.js).
   - Il componente dovrà esportare un FORM protetto (solo per utenti loggati).

2. **Campi del Form Obbligatori**
   - `Numero Conto`: (Input Text/Number, required).
   - `Password (Master o Investor)`: (Input Password, toggle visibility, required).
   - `Nome Server del Broker`: (Input Text, required, es. "ICMarkets-Live01").
   - `Sorgente Segnali / Sale VIP`: (Input Text, required). Qui l'utente scriverà l'ID Telegram (es. `@NomeSalaSegnaliVip` o `ID: -100...`) del Canale Master Telegram da cui vuole copiare i segnali. Questo campo si abbinerà nel backend alla proprietà `allowed_signal_source`.

3. **Salvataggio Sicuro su Firestore (Backend Next.js)**
   - Il "Salva" o "Aggiorna" di questa UI richiamerà una Server Action o una API Route sulla WebDashboard (es. `src/app/api/trading-credentials/route.ts`).
   - La API Router Next.js validerà il Token utente (controlla che sia un cliente effettivo) e scriverà i dati in un documento Firestore (es. collezione `trading_accounts` associato al suo UID / userDocument).
   - *Considerazione Sicurezza:* Applica un package/livello base di Encryption AES sulla password prima di salvarla in database, specificando come il nuovo `Cloud Automation Server` provvederà poi a decriptarla simmetricamente tramite Chiave d'Ambiente condivisa fra i due applicativi in `.env`.

**Vincoli Cruciali:**

- Mantieni rigorosamente il design (CSS, classi Tailwind, libreria ShadcnUI o componenti BaseUI) attualmente presenti sulla Web Dashboard. Non alterare il flow di Checkout o Login per aggiungere questo Form. Deve essere una "Sezione Extra" discreta e totalmente Self-Service.

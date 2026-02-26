# Fase 1: Inizializzazione Server Cloud e Firebase Admin

**Obiettivo della Fase:**
Creare l'infrastruttura di base per il nuovo "Cloud Automation Server". Questo server indipendente (da sviluppare in Node.js con TypeScript) sostituirà i vecchi script Python locali dei clienti. Avrà il compito di leggere il nostro database Firestore per orchestrare in seguito i segnali Telegram verso le Piattaforme MT4/MT5 via API.

## Dettagli di Sviluppo Richiesti

1. **Inizializzazione Progetto Node.js/TypeScript**
   - Crea una nuova cartella radice chiamata `CLOUD_AUTOMATION_SERVER` separata dalla Web Dashboard attuale.
   - Inizializza il progetto (`package.json`, `tsconfig.json`).
   - Installa le dipendenze fondamentali: `firebase-admin`, `dotenv`, `telegraf` (o libreria Telegram equivalente scelta).

2. **Configurazione Firebase Admin SDK**
   - Crea un file `src/config/firebase.ts`.
   - Inizializza `firebase-admin` utilizzando un Service Account key (leggibile da file o Variabili d'Ambiente).
   - Assicurati di esporre istanze pulite di `firestore()` che verranno poi usate dagli altri moduli.

3. **Inizializzazione Entry Point**
   - Crea `src/index.ts`.
   - Carica le variabili d'ambiente (dotenv).
   - Stampa un log "SoftiBridge Cloud Automation Server Started" per confermare l'avvio.
   - (Opzionale) Implementa un meccanismo di Keep-Alive se previsto un deploy su piattaforme PaaS (es. server express di base che risponda 200 OK alla radice fittizia).

**Vincoli Cruciali:**

- Questo server deve agire esclusivamente come "Reader" verso Firestore, non deve alterare le licenze (`status`, pagamenti, scadenze) che sono competenza esclusiva della Web Dashboard.

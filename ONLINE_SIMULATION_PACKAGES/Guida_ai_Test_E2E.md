# GUIDA COMPLETA AI TEST END-TO-END (SoftiBridge)

Questa guida ti accompagna passo-passo nell'esecuzione di un test reale e completo dell'intera architettura SoftiBridge. Simuleremo il flusso esatto dall'arrivo di un nuovo cliente sulla Web Dashboard, fino all'esecuzione materiale di un segnale di trading sulla sua VPS.

---

## FASE 1: Preparazione dell'Infrastruttura (LATO ADMIN)

Prima che il cliente possa interagire, il sistema centrale deve essere attivo.

1. **Avvia la Web Dashboard (Il Portale)**
   - Apri un terminale nella cartella `web-dashboard`.
   - Esegui il comando: `npm run dev`
   - Lascia questa finestra aperta. Il portale è ora raggiungibile su `http://localhost:3000`.

2. **Prepara il Pacchetto Cliente**
   - Assicurati di avere il file `CLIENT_PACKAGE.zip` pronto da inviare o caricare sulla VPS di test.

*(Opzionale)*: Se vuoi testare l'invio manuale di licenze vecchio stile, puoi usare il pacchetto `ADMIN_PACKAGE` ed eseguire `1_RUN/START_ADMIN_PANEL.bat`, ma per questo test useremo il nuovo flusso web automatizzato.

---

## FASE 2: Registrazione e Licenza (LATO CLIENTE / WEB)

Ora simuliamo il Cliente che acquista o prova il software.

1. **Accesso alla Dashboard**
   - Apri il browser e vai su `http://localhost:3000`.
   - Clicca su **"Accedi"** e registrati (puoi usare un tuo account Google o crearne uno apposito per il test).

2. **Generazione della Licenza**
   - Immediatamente dopo l'accesso, la dashboard aprirà un Popup chiedendo l'**ID Telegram** del cliente.
   - Inserisci il tuo ID Telegram. (Es. `1958421`).
   - Clicca su **"Salva e Continua"**.

3. **Verifica Esito**
   - A schermo, sotto "Licenza Attiva", apparirà magicamente una stringa lunghissima (la *License Key*).
   - ✨ **Controllo Telegram**: Guarda il tuo cellulare. Il Bot Telegram di SoftiBridge ti avrà appena inviato un messaggio di benvenuto contenente il piano "BASIC (Prova 14 giorni)" e la tua chiave!

---

## FASE 3: Installazione sulla VPS (LATO CLIENTE / VPS)

Il cliente ha la chiave e ora entra nel suo server remoto (VPS) per installare il software.

1. **Estrazione**
   - Copia il file `CLIENT_PACKAGE.zip` sulla VPS (o sul tuo PC Windows che fa da simulatore VPS) ed estrailo sul Desktop.

2. **Setup Automatico**
   - Entra nella cartella estratta. Fai clic col tasto destro sul file `setup_vps.ps1` e seleziona **"Esegui con PowerShell"**.
   - Accetta se ti chiede i permessi. Lo script creerà automaticamente le cartelle invisibili `C:\ProgramData\SoftiBridge` e configurerà il client in esecuzione automatica.

3. **Connessione Account (Il Client in Background)**
   - Sempre nella cartella estratta, esegui il file `START_CLIENT.bat`.
   - Ti verrà chiesto di incollare la tua **License Key**.
   - Incolla la chiave copiata da Telegram o dalla Web Dashboard.
   - Il Client si autenticherà con i server Firebase, confermerà la licenza "BASIC", e scriverà l'Instal ID di questa specifica VPS nel database. Si metterà poi silenziosamente in ascolto dei segnali.

4. **Iniezione MetaTrader**
   - Apri il tuo MetaTrader 4 o MetaTrader 5 (assicurandoti di avere i permessi di autotrading e le WebRequest abilitate verso `https://api.telegram.org` come da vecchia prassi).
   - Torna nella cartella estratta, fai clic col tasto destro su `mt_auto_linker.ps1` ed "Esegui con PowerShell".
   - Lo script troverà da solo la cartella `/Experts` del tuo MetaTrader e ci infilerà il file `bot_ea_stable.mq4 / .mq5`.

5. **Avvio dell'Expert Advisor**
   - Vai sul MetaTrader, aggiorna la lista degli *Expert Advisors*.
   - Trascina il bot `SoftiBridge EA` su un grafico (es. EURUSD H1).
   - Nelle impostazioni dell'EA (Inputs), inserisci l'**ID Telegram** del cliente. (L'EA lo userà per leggere i messaggi in locale passati dall'app Python invisibile).

---

## FASE 4: Test di Trasmissione (LATO ADMIN -> CLIENTE)

Adesso abbiamo: Il server Web acceso, la VPS del cliente configurata, e l'EA sul grafico. Proviamo a lanciare un segnale!

1. **Invio del Segnale (LATO ADMIN)**
   - Sul tuo PC pricipale (non la VPS simulata e non la Web Dashboard), vai nella cartella non zippata originale o estrai `ADMIN_PACKAGE.zip`.
   - Apri la cartella `1_RUN` ed esegui `START_BOT_SIGNALS.bat`.
   - Il sistema ti chiederà i dettagli del trade:
     - *Simbolo*: EURUSD
     - *Azione*: BUY
     - Piazzerai Take-Profits o Stop-Loss
   - Conferma l'invio.
   - Lo script leggerà su Firebase chi ha una licenza "ACTIVE" e manderà il messaggio criptato tramite il Bot Telegram.

2. **Esecuzione (LATO CLIENTE)**
   - Sulla VPS: Il tool `.exe` nascosto in background riceverà istantaneamente il messaggio Telegram.
   - Tradurrà il messaggio in un file JSON (decodificandolo).
   - Inserirà questo file nella coda locale sicura (`C:\ProgramData\SoftiBridge\Queues`).
   - Sulla chart di MetaTrader: L'EA di SoftiBridge leggerà questo piccolo file di testo formattato in una frazione di secondo e piazzerà il "BUY" su EURUSD!

---

## CONCLUSIONE DEI TEST

Se hai eseguito con successo questi quattro stadi in maniera fluida, congratulazioni:
Hai appena testato l'**Intero Ecosistema M2M** (Machine to Machine) di SoftiBridge.

1. Il database ha registrato l'utente autonomamente => *Web Dashboard Funzionante.*
2. La crittografia ha generato una chiave sicura e il Bot Telegram te l'ha spedita => *Back-end Funzionante.*
3. L'installazione sulla VPS è stata pulita e guidata dai nuovi script => *DevOps Client Funzionante.*
4. Il segnale è arrivato dal pannello Admin Python al terminale MT4 del cliente passando per la cifratura in locale => *Core Trading Strategy Funzionante.*

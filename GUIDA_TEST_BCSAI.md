# 🚀 Guida ai Test Operativi - BCS AI Bridge

Questa guida riassume i passaggi necessari per configurare il sistema, creare un canale di test e verificare l'esecuzione automatica delle operazioni.

---

## 🛠️ PARTE 1: Configurazione Admin (Passo dopo passo)

### 1. Prepara il Bot su Telegram

Il Bot è l'ufficio postale che riceve dai canali e spedisce agli utenti.

- Apri la chat con **@BotFather** su Telegram.
- Usa il comando `/setname` e seleziona il tuo bot, chiamalo: `BCS AI VIP BOT`.
- Assicurati che nel file `.env` del server ci sia il **token** corretto fornito da @BotFather.

### 2. Collega il Canale Segnali (La Fonte)

Il Bot deve "sentire" i messaggi che arrivano nella tua sala segnali.

- Vai nella tua **Sala Segnali** (il canale dove scrivi i segnali).
- Aggiungi il tuo Bot come **Amministratore** del canale.
- Invia un messaggio di prova nel canale (es: `BUY GOLD @ 2650`).
- Controlla la console del server: vedrai un log che dice *"Received message from channel: [ID-DEL-CANALE]"*.
- **Segnati quell'ID** (es: `-1002345678901`).

### 3. Configura la "Sorgente" nel Database

- Entra nella **Dashboard Admin** sul sito.
- Nella sezione **Utenti**, assegna all'account di test il `Signal Source Chat ID` (l'ID del canale segnato sopra).
- Assicurati che l'account abbia una licenza **ACTIVE**.

---

## 📺 PARTE 2: Creazione Canale o Gruppo di Test

### Opzione A: Canale (Consigliato)

È a senso unico, solo l'Admin scrive. È il formato standard professionale.

1. Telegram -> Nuovo Canale -> Nome (es: `BCS AI Sala Segnali TEST`).
2. Aggiungi il Bot come **Amministratore** con tutti i permessi.

### Opzione B: Gruppo

Funziona, ma tutti possono scrivere.

1. **IMPORTANTE**: Su @BotFather, vai su `Bot Settings` -> `Group Privacy` -> Imposta su **DISABLED**. Altrimenti il bot non leggerà i messaggi di testo semplici.

---

## 🧪 PARTE 3: Dati di Test (Account AvaTrade)

Utilizza questi dati per configurare l'account di trading nella Dashboard Utente per i tuoi test:

| Campo | Valore |
| :--- | :--- |
| **Broker Server** | `Ava-Demo 1-MT5` |
| **Account Number** | `101671232` |
| **Password** | `Merlino1976!` |

---

## ✅ PARTE 4: Il Test Finale

1. **Lato Utente**: Apri la chat con il Bot, scrivi `/start` e invia la tua **License Key** (es: `BCS-XXXX...`).
2. **Lato Admin**: Scrivi un segnale nel canale ufficiale nel formato:
   > `BUY GOLD @ 2650.00 SL: 2640.00 TP1: 2670.00`
3. **Risultato**: Il Bot leggerà il segnale nel canale e aprirà l'operazione su MetaTrader per tutti gli utenti sincronizzati con quel canale.

---
*Compliance GDPR 2026 // BCS AI Global Automation*

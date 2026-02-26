SOFTIBRIDGE AUTOMATION - ADMIN BOT (Telegram)

REQUISITI
- Windows VPS (consigliato) o Linux
- Python 3.10+
- Token BOT Telegram in config/config.json

COMANDI
/start
  mostra i comandi disponibili

/sync <LICENSE_KEY> <INSTALL_ID> [MT4_ONLY|MT5_ONLY|MT4_MT5]
  Genera e invia al cliente 1 file: auth_token.dat (valido per quella VPS).

/change_vps <LICENSE_KEY> <OLD_INSTALL_ID> <NEW_INSTALL_ID> [SKU]
  Disattiva OLD in DB e genera token per NEW (invio file auth_token.dat).

NOTE IMPORTANTI (1 FILE)
- Per disattivare la VPS vecchia senza inviare 2 file:
  il cliente deve importare LO STESSO auth_token.dat (generato per la nuova VPS)
  anche sulla VPS vecchia: l'EA si bloccherà per install_id mismatch.

AVVIO
1_RUN\INIT_DB.bat
1_RUN\START_BOT_ADMIN.bat

SOFTIBRIDGE AUTOMATION - CLIENT (Console)

COSA FA
- Calcola automaticamente l'INSTALL_ID della VPS e lo salva in Common Files.
- Importa un file auth_token.dat (ricevuto dal BOT ADMIN) e lo installa nel percorso corretto.
- Crea le queue MT4/MT5 (cmd_queue.txt / cmd_queue_mt5.txt) nella cartella legacy usata dagli EA.

PERCORSI (Common Files)
- Token:   %PUBLIC%\Documents\Common\Files\softibridge_automation\run\auth_token.dat
- Install: %PUBLIC%\Documents\Common\Files\softibridge_automation\run\install_id.txt
- Queue:   %PUBLIC%\Documents\Common\Files\softibridge\inbox\cmd_queue.txt
          %PUBLIC%\Documents\Common\Files\softibridge\inbox\cmd_queue_mt5.txt

USO RAPIDO
1) Esegui 1_RUN\INSTALL_CLIENT.bat (una volta sola)
2) Esegui 1_RUN\RUN_CLIENT.bat
3) Menu -> 1️⃣ Importa Token -> seleziona auth_token.dat -> conferma S

CAMBIO VPS (1 FILE)
- Sulla NUOVA VPS: invia /sync al BOT ADMIN, ricevi auth_token.dat e importalo.
- Per disattivare la VPS vecchia senza 2 file: importa LO STESSO auth_token.dat anche sulla VPS vecchia.

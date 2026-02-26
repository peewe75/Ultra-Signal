# SOFTIBRIDGE PROMPT: USER DASHBOARD (GESTIONE CLIENTE)

Sviluppa la Dashboard riservata agli utenti che hanno effettuato il login e acquistato un abbonamento.

## 1. Dashboard Home (Overview)

- **Stato Licenza**: Mostra un badge colorato (ACTIVE in verde, EXPIRED in arancione, SUSPENDED in rosso).
- **License Key**: Visualizza la chiave (es. `SB-XXXX-XXXX`) con un bottone "Copia".
- **Statistiche Rapide**: Mostra "Account Utilizzati / Account Totali" (es. 2/3).

## 2. Gestione Abbonamento

- Card con dettagli del piano attuale.
- Bottone "Gestisci Abbonamento": Deve aprire il **Stripe Customer Portal** per:
  - Cambiare metodo di pagamento.
  - Visualizzare fatture.
  - Disdire il rinnovo automatico.
  - Upgrade del piano (es. da BASIC a PRO) con calcolo pro-rata automatico di Stripe.

## 3. Impostazioni & Account (Core Logic)

- **Autorizzazione Account**: Un'area dove l'utente può inserire o modificare i numeri di account MT4/MT5 che il Bot deve accettare.
- **Validazione**: Se l'utente ha un piano BASIC e prova a inserire un secondo account, mostra un messaggio: "Limite raggiunto. Fai l'upgrade a PRO per aggiungere altri account".
- **Istruzioni Attivazione**: Un piccolo stepper o guida video su come inserire la licenza nel Bot Telegram / Client desktop.

## 4. UI/UX

- Sidebar laterale con: Home, Licenze, Pagamenti, Supporto.
- Tema Dark coerente con la Landing Page.
- Feedback immediato (Toast notifications) dopo ogni azione riuscita.

# SOFTIBRIDGE PROMPT: ADMIN DASHBOARD (CENTRO DI CONTROLLO)

Crea l'interfaccia protetta per gli amministratori per gestire l'intero ecosistema SoftiBridge.

## 1. Sicurezza

- Accesso riservato esclusivamente agli utenti con `role: 'admin'` in Clerk/DB.

## 2. User Management

- Tabella con tutti gli utenti registrati.
- Filtri per: Nome, Email, Stato Abbonamento.
- Azione "Visualizza Dettagli": Apre una scheda con lo storico pagamenti e le licenze associate.

## 3. License & Sync Monitor

- **Tabella Licenze Attive**:
  - Mostra Telegram ID, User Email, Piano, Scadenza.
  - Colonna **Sync State**: Mostra l' `install_id` della VPS rilevata (identificativo hardware).
- **Kill-Switch**: Bottone rosso "REVOCA LICENZA" per sospendere istantaneamente l'operatività di un utente (anche prima della scadenza naturale).

## 4. Global Settings & Database

- Sezione per modificare i prezzi o i limiti dei piani globalmente.
- **Audit Log**: Visualizzazione degli ultimi eventi (es: "Utente X ha cambiato VPS", "Licenza Y scaduta", "Upgrade effettuato").
- **Backup**: Bottone per esportare il database completo in formato JSON o CSV.

## 5. Visual Design

- Layout più denso di informazioni rispetto alla Dashboard utente.
- Utilizzo di tabelle filtrate e grafici (es. Recharts) per visualizzare la crescita degli abbonati.

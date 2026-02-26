# Master Instructions for AI Coding Assistant: SoftiBridge Web Ecosystem

Queste istruzioni sono destinate a un programma di coding AI (come Cursor, Replit Agent, o GPT-4o con accesso al file system) per costruire l'intera infrastruttura web di SoftiBridge.

## 1. Stack Tecnologico Suggerito

- **Frontend/Backend**: Next.js 14+ (App Router) per SEO e performance.
- **Styling**: Tailwind CSS + ShadcnUI per un design premium e moderno.
- **Autenticazione**: Clerk o NextAuth (gestione sessioni, social login).
- **Database**: Supabase (PostgreSQL) o Firebase per sincronizzazione real-time.
- **Pagamenti**: Stripe (gestione abbonamenti, upgrade, disdette).
- **Deployment**: Vercel.

---

## 2. Prompt Master per la Generazione

### Proposta di Prompt 1: Landing Page & Auth

> "Crea una Landing Page premium per 'SoftiBridge Automation'. Design futuristico, dark mode (toni blu elettrico e grigio scuro). Sezioni: Hero, Features del Bot, Pricing (Basic/Pro/Enterprise), Testimonianze. Aggiungi una pagina di Registrazione e Login integrata con Clerk. La landing deve vendere l'idea dell'automazione nel trading e avere una CTA chiara verso l'acquisto del piano."

### Proposta di Prompt 2: User Dashboard & Stripe

> "Sviluppa la Dashboard Utente. Deve includere:
>
> 1. Header con Profilo e Stato Licenza.
> 2. Card principale: 'Il tuo Abbonamento' con nome piano, data scadenza e bottone 'Upgrade/Rinnova'.
> 3. Integrazione Stripe Customer Portal per permettere all'utente di gestire i pagamenti, vedere le fatture o disdire il rinnovo automatico.
> 4. Sezione 'Licenza': Mostra la License Key generata. Accanto alla licenza, un campo input per inserire i propri account MT4/MT5 autorizzati (limite basato sul piano: 1, 3 o 10)."

### Proposta di Prompt 3: Admin Dashboard (Secure)

> "Crea una Dashboard Amministrativa protetta. Solo gli utenti con ruolo 'admin' possono accedere.
> Funzionalità:
>
> 1. Lista completa utenti con ricerca.
> 2. Tabella Licenze: Stato (Active/Expired/Suspended), Account collegati, Install_ID della VPS.
> 3. Azioni rapide: Generate License, Suspend Client, Delete Account.
> 4. Stats: Entrate mensili, Numero attivazioni totali."

---

## 3. Logica di Sincronizzazione (Business Logic)

L'AI di coding deve implementare questi flussi:

### Flusso Acquisto & Licenza

1. **Checkout**: L'utente completa il pagamento su Stripe.
2. **Webhook**: Stripe invia conferma al backend `api/webhook`.
3. **Generazione**: Il backend genera una chiave unica (es. `SB-ABCD-...`) e la salva nel DB associata all'utente.
4. **Email**: Invia la chiave via email e mostrala nella Dashboard.

### Flusso EA Activation

1. L'utente copia la chiave dalla Dashboard.
2. L'utente la usa nel Bot Telegram `/sync <CHIAVE>`.
3. Il sistema ADMIN valida la chiave chiamando il Database centrale.

---

## 4. Requisiti di Visual Design (Istruzioni per l'AI)

- **Aesthetics**: "Wow factor" richiesto. Usa animazioni Framer Motion.
- **UI Components**:
  - Dashboard con barra laterale collassabile.
  - Badges colorati per lo stato (Active = Verde, Suspended = Rosso).
  - Pulsante "Copy to Clipboard" per la License Key.

---

## 5. Deployment Checklist

1. Collega il repository GitHub.
2. Configura le variabili d'ambiente (DATABASE_URL, STRIPE_SECRET_KEY, CLERK_SECRET_KEY).
3. Esegui la migrazione del database.
4. Testa il flusso di pagamento in modalità Sandbox.

# SOFTIBRIDGE PROMPT: CORE INFRASTRUCTURE SETUP

Utilizza queste istruzioni come base prima di iniziare a costruire le pagine specifiche.

## 1. Obiettivo Tecnico

Configurare l'ambiente di sviluppo per un'applicazione SaaS professionale utilizzando Next.js 14+.

## 2. Tecnologie Richieste

- **Framework**: Next.js (App Router).
- **Frontend**: React, Tailwind CSS, Lucide React (icone).
- **Componenti UI**: Shadcn/UI (Radix UI).
- **Animazioni**: Framer Motion.
- **Autenticazione**: Clerk (gestione ruoli: 'user', 'admin').
- **Database**: Supabase o Prisma con PostgreSQL.
- **Pagamenti**: Stripe SDK.

## 3. Struttura Database (Schema Suggerito)

Crea le seguenti tabelle:

- **Profiles**: `id` (clerk_id), `email`, `role` (default: 'user').
- **Subscriptions**: `id`, `user_id`, `stripe_id`, `plan` (BASIC/PRO/ENTERPRISE), `status` (ACTIVE/EXPIRED), `expires_at`.
- **Licenses**: `id`, `user_id`, `license_key`, `install_id`, `mt_accounts` (array of strings), `status`.

## 4. Integrazione Stripe

- Configura i prodotti Stripe con i prezzi:
  - BASIC: €59/30gg, €149/90gg, etc.
  - PRO: €109/30gg, €279/90gg, etc.
  - ENTERPRISE: €199/30gg, €499/90gg, etc.
- Implementa i **Webhook** per ascoltare gli eventi:
  - `checkout.session.completed`: Attiva l'abbonamento e genera la licenza.
  - `customer.subscription.deleted`: Segna l'abbonamento come disdetto nel DB.
  - `invoice.paid`: Rinnova la validità della licenza.

## 5. Variabili d'Ambiente (.env)

Configura gli hook per:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
- `DATABASE_URL`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`

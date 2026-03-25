# Zolio — SaaS de gestion pour les artisans du bâtiment

Zolio est une application tout-en-un pour les professionnels du bâtiment : devis, factures, signature électronique, catalogue de prestations et suivi d'activité.

## 🚀 Démarrage rapide

### Prérequis

- Node.js 18+
- PostgreSQL (ou Vercel Postgres / Supabase)
- Compte Clerk (authentification)
- Compte Stripe (paiements)

### Installation

```bash
# Cloner le repo
git clone https://github.com/LSSHRT/zolio-saas.git
cd zolio-saas

# Installer les dépendances
npm install

# Copier le fichier d'exemple de variables d'environnement
cp .env.example .env.local

# Configurer les variables d'environnement (voir ci-dessous)
nano .env.local

# Générer le client Prisma
npx prisma generate

# Lancer les migrations de base de données
npx prisma migrate dev

# Lancer en mode développement
npm run dev
```

### Variables d'environnement

| Variable | Description | Obligatoire |
|----------|-------------|-------------|
| `DATABASE_URL` | URL de connexion PostgreSQL | ✅ |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clé publique Clerk | ✅ |
| `CLERK_SECRET_KEY` | Clé secrète Clerk | ✅ |
| `NEXT_PUBLIC_APP_URL` | URL de l'app (ex: http://localhost:3000) | ✅ |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe | ✅ |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Clé publique Stripe | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Secret webhook Stripe | ✅ |
| `GEMINI_API_KEY` | Clé API Google Gemini (IA) | ✅ |
| `PUBLIC_DEVIS_LINK_SECRET` | Secret pour les tokens de devis publics | ✅ |
| `CRON_SECRET` | Secret pour les appels cron | ✅ |
| `ADMIN_EMAIL` | Email de l'admin | Optionnel |
| `SMTP_HOST` | Serveur SMTP transactionnel | Optionnel |
| `SMTP_USER` | Login SMTP | Optionnel |
| `SMTP_PASS` | Mot de passe SMTP | Optionnel |
| `PROSPECT_SMTP_HOST` | Serveur SMTP prospection | Optionnel |
| `PROSPECT_SMTP_USER` | Login SMTP prospection | Optionnel |
| `PROSPECT_SMTP_PASS` | Mot de passe SMTP prospection | Optionnel |
| `HUNTER_API_KEY` | Clé API Hunter.io (recherche d'emails) | Optionnel |

## 📂 Architecture

```
src/
├── app/                    # Pages et routes API (Next.js App Router)
│   ├── api/                # Routes API
│   │   ├── devis/          # CRUD devis
│   │   ├── factures/       # CRUD factures
│   │   ├── clients/        # CRUD clients
│   │   ├── stripe/         # Paiements
│   │   ├── ai/             # IA (génération de devis)
│   │   ├── cron/           # Robot de prospection
│   │   └── webhooks/       # Webhooks Stripe
│   ├── dashboard/          # Tableau de bord
│   ├── devis/              # Liste et détails des devis
│   ├── nouveau-devis/      # Création de devis
│   ├── factures/           # Liste des factures
│   ├── clients/            # Gestion des clients
│   ├── catalogue/          # Catalogue de prestations
│   ├── admin/              # Panel admin
│   └── parametres/         # Réglages entreprise
├── components/             # Composants React réutilisables
├── lib/                    # Utilitaires et logique métier
│   ├── prisma.ts           # Connexion base de données
│   ├── company.ts          # Profil entreprise
│   ├── generatePdf.ts      # Génération PDF
│   ├── sendEmail.ts        # Envoi d'emails
│   ├── prospecting.ts      # Logique de prospection
│   └── client-dashboard.ts # Données du dashboard
prisma/
└── schema.prisma           # Schéma de la base de données
```

## 🛠️ Commandes

```bash
npm run dev          # Lancer le serveur de développement
npm run build        # Build de production
npm run start        # Lancer le serveur de production
npm run lint         # Vérifier le code avec ESLint
npm run test         # Lancer les tests
npm run test:watch   # Lancer les tests en mode watch
npm run test:coverage # Rapport de couverture
```

## 🧪 Tests

Les tests sont écrits avec [Vitest](https://vitest.dev/). Pour lancer les tests :

```bash
npm run test
```

Les fichiers de tests sont dans `src/lib/__tests__/`.

## 🔐 Sécurité

- **Authentification** : Clerk (email, Google, Apple)
- **Tokens de devis** : HMAC-SHA256 avec expiration (7 jours)
- **Webhooks Stripe** : Vérification de signature
- **Headers sécurité** : HSTS, CSP, COOP, COEP, CORP
- **Rate limiting** : Via quotas API

## 📧 Prospection

Le robot de prospection fonctionne via un cron Vercel qui :
1. Découvre des entreprises via Hunter.io
2. Envoie des emails de prospection
3. Respecte un système de warmup (envoi progressif)
4. Applique un cooldown de 60 jours entre chaque contact

## 📄 Licence

MIT

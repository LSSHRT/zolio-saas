# Changelog — Zolio SaaS

## [1.3.0] — 2026-03-26

### ✨ Architecture
- **Normalisation des lignes de devis** — les lignes JSON stockées dans le champ `lignes` de la table `Devis` ont été migrées vers une nouvelle table `LigneDevis`
- Nouveau modèle Prisma `LigneDevis` avec relation vers `Devis` (onDelete: Cascade)
- Champs : `nomPrestation`, `unite`, `quantite`, `prixUnitaire`, `totalLigne`, `tva`, `isOptional`, `position`
- Le champ `lignes` (JSON) est marqué `@deprecated` et gardé pour rétrocompatibilité

### 🔧 Technique
- Nouveau helper `lib/devis-lignes.ts` — logique commune (parse, normalise, computeTotals, CRUD)
- Routes API mises à jour : `devis/route.ts`, `devis/[numero]/route.ts`, `devis/[numero]/convert/route.ts`, `devis/[numero]/duplicate/route.ts`, `devis/[numero]/statut/route.ts`, `public/devis/[numero]/route.ts`
- Script de migration `scripts/migrate-lignes.ts` pour déplacer les données existantes
- Toutes les routes utilisent `lignesNorm` en priorité avec fallback JSON

## [1.2.0] — 2026-03-26

### 🧹 Nettoyage
- **Retiré 32 fichiers inutiles** du tracking git (`.idea/`, `.junie/`, scripts JS de debug, binaire `acli` de 16 Mo, captures Playwright)
- **Supprimé les fichiers physiques** de scripts JS debug
- **Mis à jour `.gitignore`** pour couvrir : IDE configs, binaires, output, config/

### 🧪 Tests
- **+25 tests unitaires** ajoutés (document-number, trades, prestations)
- **Total : 67 tests** — tous passent ✅
- Couverture des modules critiques : `prospecting`, `public-devis-token`, `company`, `document-number`, `trades`, `prestations`

### 🔒 Sécurité
- **npm audit fix** — corrigé 2 vulnérabilités (flatted, picomatch)
- **Rapport d'audit mis à jour** — reflète l'état actuel du projet

### 🧹 Lint
- **Réduction de 12 → 6 warnings** (0 erreurs)
- Corrigé imports non utilisés dans : `Skeleton.tsx`, `dashboard/page.tsx`, `stripe/portal/route.ts`, tests

### 📄 Documentation
- **RAPPORT-AUDIT.md** mis à jour avec statut des corrections
- **CHANGELOG.md** créé

---

## [1.1.0] — 2026-03-25

### ✨ Fonctionnalités
- Relation Prisma Devis→Facture (`devisId` + `devis` relation)
- Headers de sécurité : HSTS, COOP, COEP, CORP
- Import Analytics optimisé (`@vercel/analytics/next`)
- Types `any` corrigés → `error: unknown`
- Fallback de secret corrigé (throw si `PUBLIC_DEVIS_LINK_SECRET` absent)

---

## [1.0.0] — 2026-03-25

### 🚀 Lancement initial
- Next.js 16 (App Router) + React 19 + TypeScript
- Prisma (PostgreSQL) + Clerk (auth) + Stripe (paiements)
- Landing page premium avec animations Framer Motion
- Dashboard intelligent avec signals et priorités
- CRUD complet : devis, factures, clients, prestations, dépenses, notes
- Génération PDF professionnelle (devis + factures)
- Signature électronique (token HMAC-SHA256 + expiration 7j)
- IA Gemini pour génération de devis
- Prospection automatique avec warmup
- Panel admin complet
- Dark mode
- Tour interactif (Joyride)
- PWA ready

# Changelog — Zolio SaaS

## [1.5.0] — 2026-03-27

### ✨ Nouveautés
- **Notifications Web Push** — popup de permission, notifications pour devis créé/signé, facture payée, rappels
- **Tags et notes internes** sur les devis (catégories, couleurs, notes épinglées)
- **Export CSV** des devis (`/api/export/csv`)
- **Top 5 clients** par revenu dans le dashboard
- **Filtre par tags** dans la liste des devis (`?tag=urgent`)
- **Calculateur de marge** (lib/margin.ts)
- **Notes améliorées** — catégories (Chantier, Personnel, Idée, À faire), couleurs, épinglées
- **Landing page** — textes réduits sur mobile

### 🔧 Technique
- Service Worker corrigé (handler fetch, ne bloque plus les requêtes cross-origin)
- Abonnements push stockés en DB (au lieu de mémoire)
- +7 tests (total 113)
- 11 fichiers de test

### 🐝 Prospection
- Emails personnalisés par métier (10 métiers avec exemples)
- Tracking ouvertures emails (pixel 1x1)
- A/B testing (3 variantes d'objet)
- Déduplication améliorée (inclut Opened et Failed)
- Plus de domaines ScrapingBee (3 requêtes/cible)

## [1.4.0] — 2026-03-26 (soir)
- Monitoring Sentry configuré
- Photos upload vers Vercel Blob
- Fallback clés API Gemini
- Emails personnalisés par métier
- Relances automatiques factures
- Tracking ouvertures emails

## [1.3.0] — 2026-03-26 (après-midi)
- CORS restreint
- Rate limiting sur toutes les routes API
- Validation statuts et inputs
- +20 tests (total 87)

## [1.2.0] — 2026-03-26 (matin)
- Normalisation lignes devis (JSON → table LigneDevis)
- ScrapingBee + Hunter intégré
- Email prospection amélioré
- Cron toutes les 30 min

## [1.1.0] — 2026-03-25
- Relation Prisma Devis→Facture
- Headers sécurité (HSTS, COOP, COEP, CORP)
- Import Analytics optimisé

## [1.0.0] — 2026-03-25
- Lancement initial (Next.js, Prisma, Clerk, Stripe)
- CRUD complet (devis, factures, clients, prestations)
- Génération PDF, signature électronique
- IA Gemini, prospection auto

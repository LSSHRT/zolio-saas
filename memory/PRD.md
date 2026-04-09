# Zolio — PRD (Product Requirements Document)

## Produit
Zolio est une application SaaS de gestion commerciale pour artisans et independants. Elle permet de creer des devis, factures, gerer les clients, le planning, et suivre la tresorerie.

## Stack technique
- **Frontend** : Next.js 16 (App Router), React, Tailwind CSS v4, Framer Motion
- **Auth** : Clerk (@clerk/nextjs)
- **Data Fetching** : SWR + Next.js API Routes
- **BDD** : PostgreSQL via Prisma ORM
- **Paiements** : Stripe

## Architecture
```
/app/
├── src/app/           # Pages (App Router)
├── src/components/    # Composants partages
├── src/proxy.ts       # Middleware Clerk
├── prisma/            # Schema BDD
└── package.json
```

## Ce qui a ete implemente

### Audit UX Mobile (09/04/2025)
- Ajout du dock mobile (`ClientMobileDock`) sur la page Dashboard (manquant)
- Correction des tailles de texte trop petites (`text-[9px]` → `text-[10px]`, `text-[10px]` → `text-[11px]`)
- Amelioration des touch targets (boutons min 40-44px)
- MobileDialog : pattern "bottom sheet" + safe-area iPhone
- Toaster : offset ajuste pour ne pas etre cache par le dock
- Padding bottom augmente dans ClientSubpageShell
- 17 fichiers modifies, toutes les pages principales corrigees
- Rapport : `/app/RAPPORT-AUDIT.md`

## Backlog / Taches futures
- P1 : Verification visuelle sur appareil reel avec Clerk actif
- P1 : Tests e2e des boutons mobile sur toutes les pages
- P2 : Animations d'entree/sortie pour le dock mobile
- P2 : Swipe-to-dismiss sur MobileDialog
- P3 : Mode offline / PWA

## Notes
- L'application necessite des cles Clerk valides pour fonctionner completement
- Les tests visuels ont ete effectues avec un bypass temporaire de Clerk

# Zolio — PRD (Product Requirements Document)

## Produit
Zolio est une application SaaS de gestion commerciale pour artisans et independants.

## Stack technique
- **Frontend** : Next.js 16 (App Router), React, Tailwind CSS v4, Framer Motion
- **Auth** : Clerk (@clerk/nextjs)
- **BDD** : PostgreSQL via Prisma ORM
- **Paiements** : Stripe

## Ce qui a ete implemente

### Audit UX Mobile (09/04/2025)
- Ajout du dock mobile sur la page Dashboard (manquant)
- Correction tailles de texte trop petites (text-[9px] → text-[10px], text-[10px] → text-[11px])
- Amelioration touch targets (boutons min 40-44px) sur toutes les pages
- MobileDialog : pattern "bottom sheet" + safe-area iPhone
- Toaster : offset ajuste pour ne pas etre cache par le dock
- Bouton recherche flottant (CmdKLauncher/⌘K) cache sur mobile
- Dock reequilibre : 2 items | + | 2 items, bouton "Plus" sorti en FAB flottant
- Bouton "+" redimensionne (48px, -mt-4) pour meilleure integration
- 18+ fichiers modifies, rapport : /app/RAPPORT-AUDIT.md

## Backlog
- P1 : Verification sur environnement de production avec Clerk actif
- P2 : Animations d'entree/sortie pour le dock mobile
- P2 : Swipe-to-dismiss sur MobileDialog
- P3 : Mode offline / PWA

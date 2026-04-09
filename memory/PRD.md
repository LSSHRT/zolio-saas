# Zolio — PRD (Product Requirements Document)

## Produit
Zolio est une application SaaS de gestion commerciale pour artisans et independants.

## Stack technique
- **Frontend** : Next.js 16 (App Router), React, Tailwind CSS v4, Framer Motion
- **Auth** : Clerk (@clerk/nextjs)
- **BDD** : PostgreSQL via Prisma ORM

## Ce qui a ete implemente

### Audit UX Mobile (09/04/2025)

**Phase 1 — Corrections techniques :**
- Ajout dock mobile sur Dashboard (manquant)
- Correction tailles texte (text-[9px]→[10px], text-[10px]→[11px])
- Touch targets ameliores (min 40-44px) sur toutes les pages
- MobileDialog : bottom sheet + safe-area iPhone
- Toaster repositionne au-dessus du dock

**Phase 2 — Corrections visuelles :**
- CmdKLauncher (loupe ⌘K) cache sur mobile
- Dock reequilibre : 2 items | + | 2 items (bouton "Plus" en FAB flottant)
- Bouton "+" redimensionne (48px, -mt-4)

**Phase 3 — Simplification densite d'information :**
- Dashboard : sections secondaires masquees sur mobile
- Dashboard : hero simplifie, KPIs reduits a 2 sur mobile
- ClientSubpageShell : eyebrow + description masques sur mobile
- ClientMobileOverview : 3 KPIs compacts max

**Phase 4 — Bouton "Voir plus" :**
- Bouton "Voir plus de details" / "Voir moins" en bas du dashboard mobile
- Revele les sections masquees (Pilotage, Financials, Actions, Top Clients, Quick Links)
- Chevron anime (rotation 180°)
- Visible uniquement sur mobile (sm:hidden)

## Backlog
- P1 : Verification sur environnement de production avec Clerk actif
- P2 : Animations dock mobile
- P2 : Swipe-to-dismiss MobileDialog
- P3 : PWA / mode offline

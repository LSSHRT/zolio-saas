# Zolio — PRD (Product Requirements Document)

## Produit
Zolio est une application SaaS de gestion commerciale pour artisans et independants.

## Stack technique
- **Frontend** : Next.js 16 (App Router), React, Tailwind CSS v4, Framer Motion
- **Auth** : Clerk (@clerk/nextjs)
- **BDD** : PostgreSQL via Prisma ORM

## Ce qui a ete implemente

### Audit UX Mobile — Simplification (09/04/2025)

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
- Dashboard : sections Pilotage, Financials, Top Clients, Quick Links masquees sur mobile
- Dashboard : hero simplifie (badges date/metier masques, titre reduit, signaux secondaires retires)
- Dashboard : KPI "Chiffres cles" reduit a 2 metriques sur mobile (au lieu de 4)
- Dashboard : labels sections simplifies (titre direct sans eyebrow sur mobile)
- ClientSubpageShell : eyebrow + description masques sur mobile
- ClientMobileOverview : limite a 3 KPIs compacts sans texte descriptif
- Rapport complet : /app/RAPPORT-AUDIT.md

## Backlog
- P1 : Verification sur environnement de production avec Clerk actif
- P2 : Animations dock mobile
- P2 : Swipe-to-dismiss MobileDialog
- P3 : PWA / mode offline

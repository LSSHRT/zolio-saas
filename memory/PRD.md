# Zolio — PRD (Product Requirements Document)

## Produit
Zolio est une application SaaS de gestion commerciale pour artisans et independants.

## Stack technique
- **Frontend** : Next.js 16 (App Router), React, Tailwind CSS v4, Framer Motion
- **Auth** : Clerk (@clerk/nextjs)
- **BDD** : PostgreSQL via Prisma ORM

## Audit UX Mobile Complet (09/04/2025)

### Phase 1 — Corrections techniques
- Ajout dock mobile sur Dashboard (manquant)
- Correction tailles texte (text-[9px]→[10px], text-[10px]→[11px])
- Touch targets ameliores (min 40-44px) sur toutes les pages
- MobileDialog : bottom sheet + safe-area iPhone
- Toaster repositionne au-dessus du dock

### Phase 2 — Corrections visuelles
- CmdKLauncher (loupe ⌘K) cache sur mobile
- Dock reequilibre : 2 items | + | 2 items (bouton "Plus" en FAB flottant)
- Bouton "+" redimensionne (48px, -mt-4)

### Phase 3 — Simplification Dashboard
- Sections secondaires masquees (Pilotage, Financials, Top Clients, Quick Links)
- Hero simplifie, KPIs reduits a 2 sur mobile
- Bouton "Voir plus" pour reveler les sections avancees

### Phase 4 — Dock centrage
- Dock reequilibre 2|+|2 — "Plus" sorti en FAB flottant

### Phase 5 — Pass complet toutes les pages
- **Parametres** : "Etat du dossier" simplifie — descriptions masquees sur mobile, badges OK/A faire ajoutes
- **Clients** : textes d'aide masques sur mobile
- **Planning** : cellules calendrier agrandies (p-1.5, text-sm, dots 1.5px)
- **Rapports** : sections Top Clients et Depenses par categorie masquees sur mobile
- **Depenses** : graphique camembert masque sur mobile
- **Wizard creation** : hero mobile simplifie (pas d'eyebrow, pas de description, juste titre + etape)
- **LineEditor** : header simplifie ("Lignes du devis" sans description)
- **ClientSubpageShell** : eyebrow + description masques, titre reduit sur mobile
- **ClientHeroStat** : espacement reduit, taille responsive
- **ClientSectionCard** : padding reduit sur mobile (p-4 sm:p-5 md:p-6)
- **ClientMobileOverview** : max 3 KPIs compacts sans descriptions
- Labels dashboard (benefice, tresorerie, ui) : 10px→11px

### Rapport detaille
- `/app/RAPPORT-AUDIT.md`

## Backlog
- P1 : Verification sur environnement de production avec Clerk actif
- P2 : Animations dock mobile
- P2 : Swipe-to-dismiss MobileDialog
- P3 : PWA / mode offline

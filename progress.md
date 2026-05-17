# Zolio — Refonte Design System v2 (Desktop Dense)

> Stratégie : Mobile-first intact (lg:hidden), Desktop v2 en parallèle (hidden lg:block).
> Base : Nav 240px fixe + tokens v2 sobres + DataTable dense + MetricTile + Toolbar.

---

## ✅ Phases terminées

### Phase 1 — Fondations
- `globals.css` : tokens v2 complets (bg, panels, divider, text, status colors, soft variants)
- Composants desktop primitives : Card, MetricTile, Toolbar, DataTable, DetailHeader
- Refonte `ClientDesktopNav` : 240px fixe, espacement aéré, active style v2
- Refonte `ClientSubpageShell` : header desktop v2 (breadcrumb, eyebrow, title, pills, actions)

### Phase 2 — Pages listes
- `/factures` : 4 MetricTile + Toolbar + DataTable sortable + pagination
- `/devis` : 4 MetricTile + Toolbar + DataTable sortable + pagination
- `/clients` : 4 MetricTile + Toolbar + DataTable sortable + mobile cards préservées
- `/depenses` : 4 MetricTile + 2-col layout (table gauche, pie chart 360px droite) + pagination

### Phase 3 — Pages détail
- `/factures/[numero]` : 3 MetricTile (HT/TVA/TTC tone adaptatif) + 2-col layout (infos/stripe/relances/notes vs actions sticky)
- `/clients/[id]` : 4 MetricTile + 2-col layout (contact dl + historique DataTable vs actions sticky)

### Phase 4 — Onboarding & formulaires
- **4a** `/onboarding` : wizard 3 étapes wrap mobile + desktop v2 (header + step indicator + lg-v2-panel card + 5-col métier grid + 2-col form + dl résumé)
- **4b** `/nouvelle-facture` : desktop single-page dense form (2-col main 8/12 + summary rail sticky 4/12, recherche client, table inline-edit lignes, autosave)
- **4c** `/nouveau-devis` : desktop dense form v2
- **4d** `/nouveau-devis/options` : desktop dense form v2
- **4e** `DevisEditor` : desktop dense layout v2 (component partagé avec drawer)

### Phase 5 — Outils & paramètres
- **5a** `/tva` : desktop dense layout v2
- **5b** `/notifications` : desktop dense layout v2 (category filters, date grouping)
- **5c** `/abonnement` : desktop dense layout v2 (KPI strip 4 tiles + 2-col plan/actions)
- **5d** `/calepin` : desktop dense layout v2
- **5e** `/modeles` : desktop dense layout v2
- **5f** `/catalogue` : desktop dense layout v2
- **5g** `/planning` : desktop dense layout v2
- **5h** `/recurrentes` : desktop dense layout v2
- **5i** `/rapports` : desktop dense layout v2 (trimestre filter wired)
- **5j** `/parametres` : desktop dense layout v2 (entreprise)
- **5k** `/parametres/parrainage` : desktop dense layout v2 (KPI strip 4 tiles + 2-col)

### Phase 6 — Dashboard
- `/dashboard` : refonte grid v2 dense (KPI strip 4 tiles + 2-col widgets 8/12 + 4/12 sticky)

### Phase 7 — Pages publiques (sélective)
- **7a** `/contact` : desktop dense layout v2 (form 8/12 + sticky info sidebar 4/12)
- **7b** `/changelog` : timeline polish v2 (tokens, pills par type)
- **7c** `/espace-client/[token]` : KPI strip 3 tiles + 2-col body (docs 8/12 + sticky aside 4/12)
- Conservées (hors scope v2 par choix, design adapté au contexte public) :
  - Landing (`/`) — `LandingRouter`
  - Pages légales (`/cgu`, `/cgv`, `/mentions-legales`, `/politique-confidentialite`) — `LegalPageShell` dark theme
  - Auth (`/sign-in`, `/sign-up`) — `AuthHero` + widgets Clerk
  - `/signer/[numero]` — pad de signature publique
  - `/maintenance` — page admin
  - `/unsubscribe` — page de confirmation

---

## 🏷️ Tokens v2 utilisés

```
--v2-bg                    : gris très clair
--v2-panel                 : fond carte (blanc/gris)
--v2-panel-muted           : fond ligne paire / badge
--v2-text                  : texte principal
--v2-text-strong           : titres
--v2-text-muted            : secondaire
--v2-text-subtle           : tertiaire
--v2-divider               : bordures
--v2-primary / --v2-primary-soft
--v2-success / --v2-success-soft
--v2-warning / --v2-warning-soft
--v2-danger / --v2-danger-soft
```

---

## 🧩 Classes utilitaires v2

```
lg-v2-panel               : card fond + bordure + radius
lg-v2-panel-muted         : fond alternatif
lg-v2-eyebrow             : label uppercase tracking
lg-v2-divider             : bordure standard
lg-v2-text-*              : couleurs texte
lg-v2-pill / lg-v2-pill-* : badges statut
lg-v2-btn / lg-v2-btn-*   : boutons primary/secondary/ghost/danger
```

---

*Refonte design system v2 — Phases 1 à 7 terminées.*

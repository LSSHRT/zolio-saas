# Zolio — Refonte Design System v2 (Desktop Dense)

> Stratégie : Mobile-first intact (lg:hidden), Desktop v2 en parallèle (hidden lg:block).
> Base : Nav 240px fixe + tokens v2 sobres + DataTable dense + MetricTile + Toolbar.

---

## ✅ Phases terminées

### Phase 1 — Fondations (3 commits)
- `globals.css` : tokens v2 complets (bg, panels, divider, text, status colors, soft variants)
- Composants desktop primitives : Card, MetricTile, Toolbar, DataTable, DetailHeader
- Refonte `ClientDesktopNav` : 240px fixe, espacement aéré, active style v2
- Refonte `ClientSubpageShell` : header desktop v2 (breadcrumb, eyebrow, title, pills, actions)

### Phase 2 — Pages listes (4 commits)
- `/factures` : 4 MetricTile + Toolbar (search + export + new + bulk delete) + DataTable sortable (n°/client/date/total/statut/actions) + pagination
- `/devis` : 4 MetricTile + Toolbar + DataTable sortable (n°/client/date/total/statut/actions) + pagination
- `/clients` : 4 MetricTile + Toolbar (import/export CSV + new + bulk delete) + DataTable sortable (client/email/téléphone/adresse/date/inline actions) + mobile cards préservées
- `/depenses` : 4 MetricTile + 2-col layout (table gauche, pie chart 360px droite) + pagination

### Phase 3 — Pages détail (2 commits)
- `/factures/[numero]` : 3 MetricTile (HT/TVA/TTC tone adaptatif) + 2-col layout (infos/stripe/relances/notes vs actions sticky)
- `/clients/[id]` : 4 MetricTile + 2-col layout (contact dl + historique DataTable vs actions sticky)
- Note : `/devis/[numero]` est un éditeur (formulaire) → reporté Phase 4e

### Phase 4a — Onboarding (en cours)
- `/onboarding` : wizard 3 étapes wrap mobile lg:hidden + desktop v2 hidden lg:flex
  - Header + step indicator (numéros + labels + lignes)
  - lg-v2-panel card avec 5-col métier grid, 2-col form, dl résumé
  - Boutons v2 primary/ghost

---

## 📋 Phases restantes

### Phase 4 — Formulaires (lourd)
- [ ] 4b `/nouvelle-facture` (~680 lignes)
- [ ] 4c `/nouveau-devis` (~1100 lignes) + sous-pages
- [ ] 4d `/nouveau-devis/options`
- [ ] 4e `DevisEditor` (1266 lignes, component partagé avec drawer)

### Phase 5 — Outils & paramètres (~10 pages)
- [ ] `/parametres/*` (entreprise, compte, notifications, sécurité)
- [ ] `/catalogue`
- [ ] `/calepin`
- [ ] `/modeles`
- [ ] `/planning`
- [ ] `/recurrentes`
- [ ] `/rapports`
- [ ] `/tva`
- [ ] `/notifications`
- [ ] `/abonnement`

### Phase 6 — Dashboard
- [ ] Refonte `/dashboard` en grid v2 dense (KPI strip + 2-col widgets)

### Phase 7 — Pages publiques
- [ ] Landing, `/signer`, `/espace-client`, auth pages, légales

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

*Dernier commit : `b99a736` — feat(design-v2): /clients/[id] desktop detail layout v2*

# Landing page V2

> Plan de refonte de la landing publique (`/`) pour l'aligner sur le design system v2
> tout en conservant sa force marketing.

---

## 1. Contexte & objectif

La refonte design system v2 est terminée pour toutes les pages internes (phases 1 → 7,
voir `progress.md`). La landing (`/`) a été **explicitement laissée hors scope** dans
la phase 7 :

> _Conservées (hors scope v2 par choix, design adapté au contexte public) :_
> _- Landing (`/`) — `LandingRouter`_

Aujourd'hui on veut la rapatrier dans la même cohérence visuelle que l'app, **sans
tuer** la lisibilité marketing (animations, hero fort, premium feel).

**Objectif** : une landing v2 qui :
1. partage les tokens (couleurs, typographie, radii, ombres) de l'app v2 ;
2. reste une page marketing (≠ page d'app dense) — hero impactant, social proof,
   pricing, FAQ, CTA répétés ;
3. supprime la dette technique du fichier `LandingPage.tsx` (1848 lignes
   monolithiques, mockups inline, styles ad hoc, classes `landing-*` parallèles).

**Non-objectifs** :
- Refondre les pages auth (`/sign-in`, `/sign-up`) ou légales — toujours hors scope.
- Refondre `/m/[metier]` (`TradeLandingClient.tsx`) dans ce sprint — sera traité
  dans un suivi (voir §10).
- Changer la copie / la stratégie SEO — on garde le contenu et le JSON-LD existants.

---

## 2. État actuel

### 2.1 Routage

- `src/app/page.tsx` → `LandingRouter`
- `LandingRouter` (`src/components/LandingRouter.tsx:8-26`) redirige vers
  `/dashboard` si l'utilisateur est connecté (`useUser` Clerk +
  `serverHasSession`), sinon rend `<LandingPage />`.
- `LandingPage` est un client component de **1848 lignes**.

### 2.2 Sections actuelles (dans l'ordre du DOM)

| # | Section                | Lignes        | Notes                                                    |
|---|------------------------|---------------|----------------------------------------------------------|
| 1 | Nav fixe + mobile menu | 469 → 535     | `landing-panel`, glassmorphism, logo+CTA blanc           |
| 2 | Hero                   | 538 → 943     | `KineticText` (framer scroll), pillars, mockup dashboard |
| 3 | Métiers desservis      | 946 → 973     | bandeau marquee 10 métiers (`ARTISAN_TRADES`)            |
| 4 | Comment ça marche      | 975 → 1031    | 3 étapes (devis, signature, facture)                     |
| 5 | Nouveautés             | 1033 → 1069   | 6 cards (`NOUVEAUTES`)                                   |
| 6 | Comparatif             | 1071 → 1143   | Zolio vs Excel/Papier, 8 critères                        |
| 7 | Trust band             | 1145 → 1287   | Trustpilot placeholder + highlights                      |
| 8 | Témoignages            | 1289 → 1407   | id=`testimonials`                                        |
| 9 | Features               | 1409 → 1568   | id=`features`                                            |
| 10| Pricing                | 1570 → 1685   | id=`pricing`, Gratuit vs Pro                             |
| 11| FAQ                    | 1687 → 1715   | id=`faq`, accordéon                                      |
| 12| CTA final              | 1717 → 1762   | `closingHighlights`                                      |
| 13| Footer                 | 1764 → 1801   | liens légaux + réseaux                                   |
| 14| Sticky mobile CTA      | (overlay)     | s'affiche après `scrollY > 600` (`LandingPage.tsx:426-444`) |

### 2.3 Système visuel actuel

- **Palette** : dark only (`#0c0a1d` → `#05050A`), violet/fuchsia/orange.
- **Classes ad hoc** : `landing-shell`, `landing-panel`, `landing-chip`,
  `landing-aurora`, `landing-stage`, `landing-marquee`, `landing-spotlight-card`,
  `landing-hero-orbit`, etc. — **51 occurrences** dans `globals.css`
  (lignes 627 → 1014).
- **Animations** : `framer-motion` lourd (`useScroll`, `useTransform`, parallax,
  marquee CSS), `KineticText` sur le hero, `animate-gradient`, `animate-pulse`.
- **Mockups** : mobile devis, signature, facture, dashboard — **tous inline en JSX**
  (≈ 700 lignes des 1848).
- **JSON-LD** : SoftwareApplication + Organization injecté directement dans le DOM
  (App Router-safe, voir `src/components/LandingPage.tsx:454-464`).

### 2.4 Pourquoi on refactorise

- **1848 lignes / fichier** : changements coûteux, code review difficile.
- **Système de classes parallèle** (`landing-*` vs `lg-v2-*`) : 2 conventions à
  maintenir, palettes qui dérivent, dark-only sur la landing alors que l'app
  supporte light + dark.
- **Mockups inline** : impossible de réutiliser, pas de tests visuels.
- **Pas de cohérence** entre la landing et le dashboard quand un visiteur signe :
  le saut visuel (#0c0a1d violet → blanc dense) est brutal.

---

## 3. Système de design v2 (rappel)

Tokens disponibles dans `globals.css` (`src/app/globals.css:1128-1201`), light + dark :

```
--v2-surface, --v2-surface-elevated, --v2-panel, --v2-panel-muted
--v2-border, --v2-border-strong, --v2-border-subtle
--v2-text, --v2-text-strong, --v2-text-muted, --v2-text-subtle
--v2-primary, --v2-primary-hover, --v2-primary-soft, --v2-primary-soft-strong
--v2-success / -soft, --v2-warning / -soft, --v2-danger / -soft, --v2-info / -soft
--v2-shadow-xs / -sm / -md / -lg
```

Classes utilitaires (`progress.md:83-92`) :
`lg-v2-panel`, `lg-v2-panel-muted`, `lg-v2-card`, `lg-v2-card-interactive`,
`lg-v2-eyebrow`, `lg-v2-divider`, `lg-v2-text-*`, `lg-v2-pill / -success / -warning
/ -danger / -info / -primary`, `lg-v2-btn / -primary / -secondary / -ghost / -danger`,
`lg-v2-kpi-value`, `lg-v2-nav-link`.

Patrons d'usage de référence : `src/app/dashboard/dashboard-content.tsx`
(KPI strip + 2-col + sticky aside).

---

## 4. Direction proposée

**Recommandation : Hybride (option C ci-dessous).**

| Option | Description                                                    | Verdict           |
|--------|----------------------------------------------------------------|-------------------|
| A      | Appliquer littéralement les tokens v2 (light dense)            | Trop "app", tue le marketing |
| B      | Refonte marketing sans toucher au DS                           | Manque l'objectif de cohérence |
| **C**  | **Tokens v2 (couleurs, typo, radii, ombres) + identité marketing préservée** (hero ample, animations subtiles, dark-mode optionnel) | **Retenu** |

Principes :
1. **Une seule palette source** : tous les `landing-*` mappent sur des variables
   `--v2-*`. Aucune couleur en dur dans le JSX.
2. **Light theme par défaut, dark via `.dark`** comme le reste de l'app
   (mêmes tokens). Plus de `bg-[#0c0a1d]` en dur.
3. **Densité marketing ≠ densité app** : padding plus généreux (`py-24` mini),
   typographie plus large (display 56-72px), mais ratios et radii v2.
4. **Animations conservées mais sobres** : framer-motion uniquement pour
   reveal-on-scroll discret + `useReducedMotion`. Suppression des marquees,
   parallax, gradients animés (gain perf + a11y).
5. **Composants extraits** : la landing devient un orchestrateur de sections
   (50-80 lignes), pas un monolithe.

---

## 5. Plan section-par-section

Pour chaque section : **avant** / **après v2** / **composant cible**.

### 5.1 Nav (`LandingNav`)
- **Avant** : `landing-panel` glass dark, gradient texte logo, CTA blanc.
- **Après** : `lg-v2-panel` léger (border + shadow-sm), texte `lg-v2-text-strong`,
  CTA primaire = `lg-v2-btn lg-v2-btn-primary` (violet v2).
- **Composant** : `src/components/landing/LandingNav.tsx` (client, gère mobile menu).

### 5.2 Hero (`LandingHero`)
- **Avant** : `KineticText` scroll-transform, mockup desktop + mobile inline,
  orbits, halo, signals.
- **Après** :
  - `<h1>` display ample mais statique (parallax retiré, juste un fade-in léger).
  - Sous-titre + 2 CTA (`lg-v2-btn-primary` + `lg-v2-btn-secondary`).
  - **Pillars** : 3 cards `lg-v2-card` avec icône + titre + texte court.
  - **Mockup** : on garde 1 seul mockup (dashboard) extrait en composant
    `LandingHeroMockup` (statique, basé sur tokens v2 — montre l'app telle qu'elle
    est aujourd'hui, plus de fake data inline).
- **Composant** : `src/components/landing/LandingHero.tsx` + `LandingHeroMockup.tsx`.

### 5.3 Métiers desservis (`LandingTradesBar`)
- **Avant** : marquee infini 10 métiers, animation continue.
- **Après** : grille statique 5×2 (mobile : scroll horizontal `snap-x`) avec icône
  + label en `lg-v2-card`. **Marquee retiré** (motion-sickness + perf).
- **Composant** : `src/components/landing/LandingTradesBar.tsx`.

### 5.4 Comment ça marche (`LandingHowItWorks`)
- **Avant** : 3 cards full-bleed avec gradients + mockups inline.
- **Après** : 3 colonnes `lg-v2-panel` numérotées (1/2/3), chacune avec
  illustration vectorielle (à fournir, voir §10) + titre + paragraphe. Les
  mockups inline disparaissent.
- **Composant** : `src/components/landing/LandingHowItWorks.tsx`.

### 5.5 Nouveautés (`LandingChangelog`)
- **Avant** : 6 cards spotlight (`landing-spotlight-card`).
- **Après** : 6 cards `lg-v2-card-interactive` (hover = `--v2-panel-muted`),
  pill `lg-v2-pill-primary` "Nouveau", icône tonale.
- **Bonus** : la source `NOUVEAUTES` peut être déplacée dans `src/lib/changelog.ts`
  et partagée avec `/changelog` (DRY).
- **Composant** : `src/components/landing/LandingChangelog.tsx`.

### 5.6 Comparatif (`LandingComparison`)
- **Avant** : table avec gradients, dark only.
- **Après** : table `lg-v2-panel` avec en-têtes `lg-v2-eyebrow`, rangées zébrées
  `lg-v2-panel-muted`, check vert `lg-v2-pill-success` / croix grise.
- **Composant** : `src/components/landing/LandingComparison.tsx`.

### 5.7 Trust band (`LandingTrust`)
- **Avant** : 3 cards placeholder Trustpilot.
- **Après** : zone unique `lg-v2-panel` prête à accueillir le widget Trustpilot
  réel (slot `id="trustpilot-widget"`). Sous-titre + 3 mini-stats (`lg-v2-kpi-value`).
- **Composant** : `src/components/landing/LandingTrust.tsx`.

### 5.8 Témoignages (`LandingTestimonials`)
- **Avant** : grille cards dark avec quote + photo.
- **Après** : grille 3 cards `lg-v2-card`, citation en `lg-v2-text`, auteur en
  `lg-v2-text-muted`, photo ronde 56px, icône `Quote` en `lg-v2-text-subtle`.
- **Composant** : `src/components/landing/LandingTestimonials.tsx`.

### 5.9 Features (`LandingFeatures`)
- **Avant** : grille 6 cards spotlight.
- **Après** : 6 cards `lg-v2-card-interactive` régulières, icône en
  `lg-v2-primary-soft`, titre `lg-v2-text-strong`, desc `lg-v2-text-muted`.
- **Composant** : `src/components/landing/LandingFeatures.tsx`.

### 5.10 Pricing (`LandingPricing`)
- **Avant** : 2 cards dark, plan Pro avec aura gradient + badge "POPULAIRE".
- **Après** : 2 cards `lg-v2-panel`. Pro = `lg-v2-panel` + border
  `--v2-primary` + badge `lg-v2-pill-primary`. Liste features avec
  `CheckCircle2` en `--v2-success`. CTA Gratuit = `lg-v2-btn-secondary`,
  CTA Pro = `lg-v2-btn-primary`.
- **Composant** : `src/components/landing/LandingPricing.tsx`.

### 5.11 FAQ (`LandingFaq`)
- **Avant** : `FAQItem` custom, fond dark.
- **Après** : `<details>` natif stylé avec `lg-v2-panel` + `lg-v2-divider`, icône
  `ChevronDown` qui pivote. Suppression de l'état React custom (`<details>`
  c'est gratuit + a11y).
- **Composant** : `src/components/landing/LandingFaq.tsx`.

### 5.12 CTA final (`LandingClosingCta`)
- **Avant** : grand bloc gradient warm avec 3 highlights.
- **Après** : `lg-v2-panel` aux dimensions plus posées, titre display +
  sous-titre + 2 CTA + 3 highlights en `lg-v2-pill-success`.
- **Composant** : `src/components/landing/LandingClosingCta.tsx`.

### 5.13 Footer (`LandingFooter`)
- **Avant** : `border-t border-white/10`, texte blanc dilué.
- **Après** : `border-t lg-v2-divider`, texte `lg-v2-text-muted`, logo +
  4 colonnes (Produit / Légal / Support / Réseaux). Mêmes liens.
- **Composant** : `src/components/landing/LandingFooter.tsx`.

### 5.14 Sticky mobile CTA (`LandingMobileCta`)
- **Avant** : barre fixe basse avec gradient + `scrollY > 600`.
- **Après** : barre `lg-v2-panel` avec `--v2-shadow-lg`, CTA primaire,
  même seuil scroll, `useReducedMotion`-safe.
- **Composant** : `src/components/landing/LandingMobileCta.tsx`.

---

## 6. Composants à créer

```
src/components/landing/
├── LandingNav.tsx
├── LandingHero.tsx
├── LandingHeroMockup.tsx
├── LandingTradesBar.tsx
├── LandingHowItWorks.tsx
├── LandingChangelog.tsx
├── LandingComparison.tsx
├── LandingTrust.tsx
├── LandingTestimonials.tsx
├── LandingFeatures.tsx
├── LandingPricing.tsx
├── LandingFaq.tsx
├── LandingClosingCta.tsx
├── LandingFooter.tsx
├── LandingMobileCta.tsx
└── data/
    ├── pillars.ts
    ├── trades.ts            (réutilise lib/trades si possible)
    ├── steps.ts
    ├── nouveautes.ts        (déplacer le const existant)
    ├── comparison.ts
    ├── testimonials.ts
    ├── features.ts
    ├── pricing-plans.ts
    └── faq.ts
```

Le `LandingPage.tsx` final ne fait que :

```tsx
return (
  <LandingShell>
    <LandingJsonLd />
    <LandingNav />
    <LandingHero />
    <LandingTradesBar />
    <LandingHowItWorks />
    <LandingChangelog />
    <LandingComparison />
    <LandingTrust />
    <LandingTestimonials />
    <LandingFeatures />
    <LandingPricing />
    <LandingFaq />
    <LandingClosingCta />
    <LandingFooter />
    <LandingMobileCta />
  </LandingShell>
);
```

Cible : `LandingPage.tsx` ≤ 80 lignes, chaque composant section ≤ 200 lignes.

---

## 7. Tokens / CSS à toucher

- **À supprimer** dans `globals.css` (une fois la migration finie) :
  `landing-aurora*`, `landing-marquee*`, `landing-spotlight-*`,
  `landing-hero-orbit*`, `landing-hero-floor`, `landing-hero-data-card*`,
  `landing-token-line*`, `landing-stage*`, `landing-grid-overlay`,
  `landing-halo` — soit ~400 lignes.
- **À conserver / adapter** : `landing-shell` (devient juste un wrapper qui
  applique `bg-[var(--v2-surface)]` + `min-h-screen`).
- **À ajouter** : éventuelles classes spécifiques landing (ex. `lg-v2-hero-title`
  pour la typo display 56→72px).

---

## 8. SEO / performance / accessibilité

Le contrat à ne **pas** casser :

- **SEO** : conserver le JSON-LD (SoftwareApplication + Organization) tel quel.
  Ne pas changer les `<h1>`/`<h2>` ni les ancres (`#features`, `#pricing`, `#faq`,
  `#testimonials`, `#demo`).
- **Sitemap / canonical / metadata** : aucun changement, voir
  `src/app/page.tsx` + `next.config.ts`.
- **Performance** :
  - mesurer Lighthouse avant / après (objectif : LCP ≤ 2.5s sur 4G).
  - retirer les animations CSS infinies (marquees, gradient-x) → gain CLS + CPU.
  - charger framer-motion en `dynamic({ ssr: false })` uniquement là où nécessaire.
  - mockups en `<Image>` Next.js avec `loading="lazy"`.
- **A11y** :
  - respecter `prefers-reduced-motion` partout (déjà partiellement fait avec
    `useReducedMotion`).
  - contraste AA sur fond clair (les textes en `lg-v2-text-muted` sur
    `--v2-panel` passent ; vérifier les `lg-v2-text-subtle`).
  - focus visible sur tous les CTA (utilitaire `lg-v2-btn` à auditer si besoin).
  - FAQ en `<details>/<summary>` natif (accessible par défaut).
  - `aria-label` sur la nav mobile (déjà présent ligne 503).

---

## 9. Phasage (PRs séparées)

Découpage qui permet de merger incrément par incrément (chaque phase = 1 PR
review-able en < 30 min) :

| Phase | Scope                                              | Lignes ±  | Risque |
|-------|----------------------------------------------------|-----------|--------|
| **P1**| Setup : dossier `landing/`, `LandingShell`, extract `data/*` et `LandingJsonLd`. Aucune UI cassée. | +400 / -200 | très faible |
| **P2**| Nav + Footer + MobileCta (chrome de la page).      | +300 / -180 | faible |
| **P3**| Hero + HeroMockup (cœur visuel).                   | +400 / -650 | moyen — c'est la pièce maîtresse |
| **P4**| Sections middle 1/2 : Trades, HowItWorks, Changelog, Comparison. | +500 / -400 | faible |
| **P5**| Sections middle 2/2 : Trust, Testimonials, Features. | +450 / -350 | faible |
| **P6**| Pricing + FAQ + ClosingCta.                        | +350 / -250 | moyen — pricing est sensible (conversion) |
| **P7**| Nettoyage : suppression des classes `landing-*` obsolètes dans `globals.css` + suppression du `LandingPage.tsx` historique → orchestrateur final. | +80 / -1200 | faible (visuel déjà validé) |

Chaque PR doit :
1. passer `npm run build` (AGENTS.md le réclame avant PR) ;
2. inclure un screenshot avant/après ;
3. tourner Lighthouse mobile (CLS, LCP) avant merge.

---

## 10. Suivi (hors scope de ce plan)

- **`/m/[metier]` (`TradeLandingClient.tsx`)** : 215 lignes, même problème
  (palette dark codée en dur, `landing-chip`). À refactoriser de la même
  manière après P7, en réutilisant les composants `landing/`.
- **Illustrations** "Comment ça marche" : prévoir 3 SVG avec un illustrateur
  ou un outil (ex. `undraw`). Tant qu'elles ne sont pas prêtes, on garde les
  mockups actuels mais extraits proprement.
- **Mode sombre landing** : à activer une fois P7 mergé (l'app le supporte
  déjà via `.dark`, on hérite gratuitement).
- **A/B test pricing** : si conversion change > 10 % après P6, prévoir
  rollback rapide via feature flag (à creuser avec l'équipe growth).

---

## 11. Risques & mitigations

| Risque                                              | Probabilité | Impact | Mitigation                          |
|-----------------------------------------------------|-------------|--------|-------------------------------------|
| Régression SEO (LCP, JSON-LD)                       | faible      | élevé  | mesure Lighthouse à chaque PR + smoke test JSON-LD via Google Rich Results |
| Perte de "premium feel" → conversion en baisse      | moyenne     | élevé  | comparaison side-by-side avant chaque merge + revue produit obligatoire |
| Casse du sticky mobile CTA / des ancres `#pricing`  | faible      | moyen  | tests manuels mobile sur chaque PR  |
| Drift de la palette violet (landing vs app)         | faible      | faible | tous les violets passent par `--v2-primary*`, jamais en dur |
| `framer-motion` SSR issues après refactor           | moyenne     | moyen  | composants animés en `dynamic({ ssr: false })` |

---

## 12. Critères d'acceptation

- [ ] `LandingPage.tsx` < 100 lignes, orchestrateur uniquement.
- [ ] 0 couleur codée en dur (hex/`rgb()` literal) dans `src/components/landing/`.
- [ ] Tous les `lg-v2-*` utilisés au moins une fois (panel, btn, pill, eyebrow).
- [ ] Lighthouse mobile : LCP ≤ 2.5 s, CLS ≤ 0.05, perf ≥ 90.
- [ ] Aucune régression visible sur les ancres `#features`, `#pricing`, `#faq`,
      `#testimonials`, `#demo`.
- [ ] JSON-LD SoftwareApplication + Organization rendus identiques (diff = 0).
- [ ] `prefers-reduced-motion: reduce` : aucune animation infinie, aucun
      parallax, aucun gradient animé.
- [ ] `npm run build` passe sans warning nouveau ; `npm run lint -- src` clean.
- [ ] Mode sombre (`.dark`) : la landing reste lisible (contrastes AA).

---

## 13. Questions ouvertes

1. **Dark mode landing** : on l'active dès P7 ou on attend une décision produit ?
   (recommandation : on garde light en défaut, dark hérite des tokens — pas de
   travail dédié.)
2. **Mockup hero** : on capture un vrai screenshot du dashboard à jour ou on
   maintient un mockup statique en composant ? (recommandation : screenshot
   `next/image` figé — moins de code, plus crédible.)
3. **Trustpilot** : on branche le widget réel en P5 ou on garde un placeholder ?
   (besoin d'un compte / d'un script externe — à confirmer côté ops.)
4. **`/m/[metier]`** : on l'embarque dans ce plan ou on le sort en suivi P8 ?
   (recommandation ici : **suivi**, voir §10.)

---

*Auteur : Devin — Plan rédigé en s'appuyant sur `progress.md`, `LandingPage.tsx`,
`LandingRouter.tsx`, `globals.css`, `dashboard-content.tsx`.*

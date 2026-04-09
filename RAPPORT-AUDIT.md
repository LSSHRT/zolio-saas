# Rapport d'Audit UX Mobile — Zolio

## Resume Executif

Audit complet de l'experience mobile de l'application Zolio, couvrant toutes les pages principales.
Breakpoints cibles : 375px, 390px, 414px (mobiles courants).

---

## Problemes Identifies et Corrections Appliquees

### 0. CRITIQUE — Bouton recherche (loupe + ⌘K) flottant visible sur mobile

**Probleme** : Le composant `CmdKLauncher` (bouton flottant de recherche desktop avec raccourci ⌘K) etait visible sur mobile, flottant au-dessus du dock. Cet element est inutile sur mobile car la recherche est accessible via le menu "Plus" du dock.

**Impact** : Element parasite qui encombre l'ecran mobile et cree de la confusion avec le dock.

**Correction** :
- Ajout de `hidden md:block` pour cacher completement le launcher sur mobile
- Suppression des classes responsive conditionnelles (`hidden sm:inline`) — le composant est entierement masque sous `md:`

**Fichier** : `src/components/command-palette.tsx`

---

### 0b. Bouton "+" du dock trop volumineux

**Probleme** : Le bouton central "+" du dock avait un `-mt-6` (24px) de depassement et une taille de `52x52px`, creant un decalage visuel excessif par rapport aux autres elements du dock.

**Correction** :
- `-mt-6` → `-mt-4` (16px) pour un depassement plus subtil
- `52x52px` → `48x48px` pour une meilleure integration
- Dock repositionne a `bottom-5` au lieu de `bottom-3` pour eviter le rognage des labels

**Fichier** : `src/components/client-shell.tsx`

---

### 1. CRITIQUE — Barre de navigation mobile absente sur le Dashboard

**Probleme** : La page Dashboard (`/dashboard`) ne rendait PAS le composant `ClientMobileDock`. Toutes les autres pages utilisaient `ClientSubpageShell` qui inclut le dock, mais le Dashboard avait son propre layout sans dock mobile.

**Impact** : Les utilisateurs mobiles ne pouvaient pas naviguer depuis le dashboard vers les autres sections sans utiliser le navigateur.

**Correction** :
- Import de `ClientMobileDock` dans `dashboard/page.tsx`
- Ajout de `<ClientMobileDock active="dashboard" />` avant le FAB desktop
- Le dock est maintenant visible sur TOUTES les pages

**Fichiers** : `src/app/dashboard/page.tsx`

---

### 2. Tailles de texte trop petites (text-[9px] et text-[10px])

**Probleme** : De nombreux labels utilisaient `text-[9px]` (6pt) et `text-[10px]` (6.7pt), en dessous du seuil de lisibilite mobile (minimum recommande : 11px pour les labels, 12px pour le texte courant).

**Impact** : Textes quasi illisibles sur petits ecrans, surtout en plein soleil.

**Corrections** :
- Tous les `text-[9px]` convertis en `text-[10px]` minimum
- Labels structurels (`text-[10px]` uppercase) augmentes a `text-[11px]`
- Labels du dock mobile : `text-[10px]` → `text-[11px]`

**Fichiers modifies** :
- `dashboard/page.tsx` — labels semaines, KPIs
- `devis/page.tsx` — badges options, labels totaux
- `factures/page.tsx` — labels Ref devis, Total TTC/HT
- `catalogue/page.tsx` — labels details produit
- `modeles/page.tsx` — labels grille et formulaire
- `recurrentes/page.tsx` — labels periodicite
- `rapports/page.tsx` — labels graphique
- `planning/page.tsx` — jours calendrier
- `nouvelle-facture/page.tsx` — labels Qte/Prix
- `admin/AdminMobileNav.tsx` — labels navigation admin
- `components/dashboard/ui.tsx` — labels metriques

---

### 3. Touch targets insuffisants (boutons < 44px)

**Probleme** : Plusieurs boutons avaient `py-1.5` (environ 32px de hauteur), en dessous du standard recommande de 44px pour les cibles tactiles.

**Impact** : Erreurs de tap frequentes sur mobile, frustration utilisateur.

**Corrections** :
- Boutons kanban Devis : `py-1.5` → `py-2` + `min-h-[40px]`
- Boutons kanban Factures : idem
- Bouton retour mobile (ClientSubpageShell) : `h-10 w-10` → `h-11 w-11`
- Boutons navigation calendrier (Planning) : `p-2` → `p-2.5 min-h-[44px] min-w-[44px]`
- Bouton "Ouvrir" devis mobile : ajout `min-h-[44px]`
- Icones parametres : `h-8 w-8` → `h-9 w-9` avec `size={17}`

**Fichiers** :
- `devis/page.tsx`
- `factures/page.tsx`
- `planning/page.tsx`
- `parametres/page.tsx`
- `components/client-shell.tsx`

---

### 4. Dock mobile — Amelioration des touch targets et espacement

**Probleme** : Les liens du dock avaient un padding vertical serres (`0.7rem`) et des icones legeres (`size={19}`).

**Corrections** :
- Padding dock : `py-0.7rem` → `py-0.6rem` avec `min-height: 3rem`
- Icones dock : `size={19}` → `size={20}`
- Texte dock : `text-[10px]` → `text-[11px]` + `leading-tight`
- Gap interne reduit pour mieux repartir l'espace

**Fichier** : `components/client-shell.tsx`, `globals.css`

---

### 5. MobileDialog — Responsivite et safe-area

**Probleme** : Le dialog modal s'affichait centre sur mobile, forçant un scroll invisible. Pas de gestion safe-area pour les barres de geste iPhone.

**Corrections** :
- Position mobile : centre → ancre en bas (`items-end`) pour un pattern "bottom sheet"
- Coins : `rounded-2xl` → `rounded-t-2xl` sur mobile, `sm:rounded-2xl` sur tablette
- Zone actions : ajout `pb-[max(0.75rem,env(safe-area-inset-bottom))]`
- Bouton fermer : `h-10 w-10` → `h-11 w-11`
- Label "Action rapide" : `text-[10px]` → `text-[11px]`
- Ajout `data-testid` pour tests

**Fichier** : `components/mobile-dialog.tsx`

---

### 6. Toaster cache par le dock mobile

**Probleme** : Le composant `Toaster` (sonner) etait positionne en `bottom-center` sans offset, provoquant un chevauchement avec le dock mobile.

**Correction** : Ajout `offset={80}` au Toaster pour remonter les toasts au-dessus du dock.

**Fichier** : `src/app/layout.tsx`

---

### 7. Padding bottom insuffisant sous le dock

**Probleme** : Les pages avec `ClientSubpageShell` avaient `pb-24` (6rem) ce qui pouvait cacher le dernier element sous le dock mobile.

**Correction** : `pb-24 sm:pb-28` → `pb-28 sm:pb-32` (7rem / 8rem)

**Fichier** : `components/client-shell.tsx`

---

## Resume des Fichiers Modifies

| Fichier | Type de correction |
|---------|-------------------|
| `src/app/dashboard/page.tsx` | Dock mobile ajoute, textes agrandis, data-testid |
| `src/app/devis/page.tsx` | Touch targets, labels lisibles, badges agrandis |
| `src/app/factures/page.tsx` | Touch targets, labels lisibles |
| `src/app/planning/page.tsx` | Jours calendrier, boutons navigation |
| `src/app/parametres/page.tsx` | Icones agrandies |
| `src/app/catalogue/page.tsx` | Labels produits agrandis |
| `src/app/modeles/page.tsx` | Labels formulaire agrandis |
| `src/app/recurrentes/page.tsx` | Labels periodicite agrandis |
| `src/app/rapports/page.tsx` | Labels graphique agrandis |
| `src/app/nouvelle-facture/page.tsx` | Labels + inputs agrandis |
| `src/app/admin/components/AdminMobileNav.tsx` | Icones + texte navigation admin |
| `src/components/client-shell.tsx` | Dock mobile, bouton retour, padding |
| `src/components/mobile-dialog.tsx` | Bottom sheet, safe-area, touch targets |
| `src/components/dashboard/ui.tsx` | Labels metriques |
| `src/app/globals.css` | Styles dock, touch targets |
| `src/app/layout.tsx` | Offset Toaster |

---

## Standards Respectes

- Touch target minimum : 40-44px (conformite WCAG 2.5.5 niveau AAA)
- Taille texte minimum : 11px pour labels, 14px pour texte courant
- Safe-area : gestion via `env(safe-area-inset-bottom)` pour iPhone
- Design Aesthetic : conservee (meme palette, meme style)

---

*Rapport genere le 09/04/2025*

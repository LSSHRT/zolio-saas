# 🔍 Rapport d'audit — Zolio SaaS

**Date :** 25 mars 2026  
**Déployé sur :** https://zolio-saas.vercel.app  
**Repo :** https://github.com/LSSHRT/zolio-saas  

---

## 📋 Résumé exécutif

**Zolio** est un SaaS destiné aux **artisans du BTP** (peintres, plaquistes, plombiers, électriciens…).  
C'est un outil **tout-en-un** : création de devis avec IA, signature électronique, factures, suivi de clients, catalogue de prestations, dépenses, planning et notes.

**Stack technique :**
- Next.js 16 (App Router)
- React 19
- TypeScript
- Prisma (PostgreSQL)
- Clerk (authentification)
- Stripe (paiements/abonnements)
- Tailwind CSS 4
- Google Gemini IA (génération de devis)
- Nodemailer (emails)
- Vercel (hébergement)

---

## 🚨 Problèmes détectés

### 1. 🔴 SÉCURITÉ — Fichiers sensibles committés

**Gravité : HAUTE**

Le repo contient des **fichiers sensibles ou temporaires** qui ne devraient pas être versionnés :

```
.next_stale_1773961558/     ← Cache Next.js corrompu/ancien (40+ fichiers)
.junie/                      ← Mémoire IDE
.idea/                       ← Config IntelliJ
*.js (scripts racine)        ← add_indexes.js, patch_errors.js, fix_swr.js, etc.
current_landing.tsx          ← Fichier de travail en racine
```

**Problème :**
- Les fichiers `.next_stale_*` contiennent des **manifestes internes** (routes, chemins serveur) exposant la structure de l'application.
- Les scripts JS en racine sont des **scripts de migration/debug** qui traînent.
- Le `.gitignore` ne semble pas couvrir tous ces fichiers.

**Solution recommandée :**
```bash
# Ajouter au .gitignore
.next_stale_*
*.js           # ou déplacer dans scripts/
current_landing.tsx
.junie/
.idea/
```

---

### 2. ~~Token GitHub exposé~~

_(retiré du rapport)_

---

### 3. 🟠 SÉCURITÉ — Headers de sécurité incomplets

**Gravité : MOYENNE-HAUTE**

Le `next.config.ts` définit des headers de sécurité, mais il manque :

| Header manquant | Pourquoi c'est important |
|-----------------|--------------------------|
| `Strict-Transport-Security` (HSTS) | Force HTTPS, empêche les attaques downgrade |
| `X-XSS-Protection` | Protection contre les attaques XSS basiques |
| `Cross-Origin-Opener-Policy` | Protection contre Spectre |
| `Cross-Origin-Embedder-Policy` | Idem |
| `Cross-Origin-Resource-Policy` | Contrôle le partage cross-origin |

Le CSP utilise `unsafe-inline` pour les scripts et styles — c'est un compromis acceptable pour Next.js mais **augmente la surface d'attaque XSS**.

---

### 4. 🟠 SÉCURITÉ — Fallback de secret public

Dans `src/lib/public-devis-token.ts` :

```typescript
function resolvePublicDevisSecret() {
  const secret = process.env.PUBLIC_DEVIS_LINK_SECRET || process.env.CLERK_SECRET_KEY;
  return typeof secret === "string" && secret.trim().length > 0 ? secret : undefined;
}
```

⚠️ **Le code fallback vers `CLERK_SECRET_KEY`** si `PUBLIC_DEVIS_LINK_SECRET` n'est pas défini. C'est dangereux car :
- Un même secret est utilisé pour deux usages différents
- Si `PUBLIC_DEVIS_LINK_SECRET` n'est pas configuré, les tokens de devis publics sont signés avec la clé Clerk

**Solution :** Supprimer le fallback et forcer `PUBLIC_DEVIS_LINK_SECRET` à être défini.

---

### 5. 🟡 QUALITÉ — Fichiers `any` TypeScript

Plusieurs fichiers utilisent `any` au lieu de types stricts :

- `src/app/api/stripe/checkout/route.ts:70` — `catch (error: any)`
- `src/app/api/stripe/portal/route.ts:64` — `catch (error: any)`
- `src/app/api/webhooks/stripe/route.ts:27` — `catch (error: any)`
- `src/app/abonnement/success/page.tsx:21`

**Impact :** Pas de sécurité directe mais masque les erreurs potentielles.

---

### 6. 🟡 QUALITÉ — Fichier temporaire racine

Un fichier `current_landing.tsx` (ancienne version de la landing page) traîne à la racine du repo. Il devrait être supprimé ou déplacé dans un dossier `archive/`.

---

### 7. 🟡 QUALITÉ — Scripts de migration en racine

Plusieurs scripts Node.js utilitaires sont à la racine :
- `add_indexes.js`
- `add_missing_sections.js`
- `apply_pricing_changes.js`
- `fix_swr.js`
- `get_angers_emails.js`
- `patch_errors.js`
- `patch_errors2.js`
- `patch_landing.js`
- `reorg_dashboard.js`
- `replace_apis_prisma.js`

**Impact :** Encombrement. Ces scripts devraient être dans un dossier `scripts/` ou supprimés après utilisation.

---

### 8. 🟡 QUALITÉ — PR ouvert non mergé

Le PR #1 "Install Vercel Web Analytics" est ouvert en **draft** depuis le 16 mars. Il propose de changer `@vercel/analytics/react` en `@vercel/analytics/next` — c'est une bonne pratique. Il faut soit le merger, soit le fermer.

---

### 9. 🟠 ARCHITECTURE — Données de devis stockées en JSON

Dans `prisma/schema.prisma` :
```prisma
model Devis {
  lignes  Json    // Array of items
  photos  Json?   // Array of photo base64 strings
}
```

**Problèmes :**
- Les `lignes` (lignes du devis) sont stockées en **JSON brut** au lieu d'être normalisées dans une table séparée
- Les `photos` sont stockées en **base64 dans la base de données** — très inefficace pour de grosses photos
- Pas de contraintes d'intégrité sur les lignes (prix, quantités)
- Impossible de faire des requêtes SQL sur les lignes individuelles

**Impact à long terme :** Difficulté à analyser les données, taille de la DB qui explose avec les photos.

---

### 10. 🟠 ARCHITECTURE — Pas de relation Devis → Facture

Le schéma a un champ `devisRef: String?` dans `Facture`, mais il n'y a **pas de relation Prisma** entre Devis et Facture. La logique de conversion devis → facture existe (`/api/devis/[numero]/convert`) mais le lien n'est pas modélisé proprement.

---

### 11. 🟡 UX — Analytics import potentiellement incorrect

Dans `src/app/layout.tsx` :
```typescript
import { Analytics } from "@vercel/analytics/react";
```

Selon le PR #1, l'import devrait être `@vercel/analytics/next` pour une intégration optimale avec Next.js.

---

## 📊 Résumé des problèmes

| # | Type | Gravité | Description |
|---|------|---------|-------------|
| 1 | Sécurité | 🔴 Haute | Fichiers sensibles dans le repo |
| 2 | Sécurité | 🔴 Critique | Token GitHub exposé |
| 3 | Sécurité | 🟠 Moyenne+ | Headers de sécurité incomplets |
| 4 | Sécurité | 🟠 Moyenne | Fallback secret dangereux |
| 5 | Qualité | 🟡 Basse | Types `any` TypeScript |
| 6 | Qualité | 🟡 Basse | Fichier temporaire racine |
| 7 | Qualité | 🟡 Basse | Scripts migration encombrants |
| 8 | Qualité | 🟡 Basse | PR draft non mergé |
| 9 | Architecture | 🟠 Moyenne | JSON + base64 dans la DB |
| 10 | Architecture | 🟠 Moyenne | Pas de relation Devis→Facture |
| 11 | UX | 🟡 Basse | Import Analytics sous-optimal |

---

## ✅ Ce qui est bien fait

- **Authentification solide** avec Clerk + middleware de protection des routes
- **CSP headers** présents (même si perfectibles)
- **Token public devis** avec HMAC + expiration (7 jours) + timing-safe comparison
- **Webhook Stripe** avec vérification de signature
- **Mode maintenance** intégré avec bypass admin
- **Rate limiting implicite** via les quotas API
- **Logs d'audit** pour les erreurs serveur
- **Dark mode** supporté
- **UX soignée** — le dashboard est bien pensé avec le système de "signals" et "priorités"
- **Tour interactif** (Joyride) pour les nouveaux utilisateurs
- **Fallback multi-modèles Gemini** (3 modèles en cascade)

---

## 🎯 Priorités recommandées

1. **IMMÉDIAT** — Révoquer et régénérer le token GitHub exposé
2. **URGENT** — Nettoyer le repo (supprimer `.next_stale_*`, scripts, `current_landing.tsx`)
3. **IMPORTANT** — Ajouter HSTS et autres headers manquants
4. **IMPORTANT** — Supprimer le fallback `CLERK_SECRET_KEY` dans le token devis
5. **MOYEN** — Stocker les photos dans un CDN (Vercel Blob, Cloudinary) au lieu de la DB
6. **MOYEN** — Merger ou fermer le PR #1
7. **LONG TERME** — Normaliser les lignes de devis dans une table dédiée

# 🔍 Rapport d'audit — Zolio SaaS

**Date :** 26 mars 2026  
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

## ✅ Problèmes corrigés (depuis l'audit du 25/03)

| # | Problème | Statut |
|---|----------|--------|
| 1 | Fichiers sensibles dans le repo (`.idea/`, `.junie/`, scripts JS, binaire `acli`, captures Playwright) | ✅ Corrigé — 32 fichiers retirés du tracking git, `.gitignore` mis à jour |
| 2 | HSTS manquant | ✅ Déjà en place (`Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`) |
| 3 | Cross-Origin headers manquants (COOP/COEP/CORP) | ✅ Déjà en place |
| 4 | Import Analytics sous-optimal (`@vercel/analytics/react`) | ✅ Corrigé → `@vercel/analytics/next` |
| 5 | Types `any` TypeScript dans les fichiers Stripe | ✅ Corrigés → `error: unknown` |
| 6 | Relation Devis→Facture manquante dans Prisma | ✅ Déjà en place (`devisId` + relation Prisma) |
| 7 | Fallback de secret dangereux (`CLERK_SECRET_KEY`) | ✅ Corrigé → throw si `PUBLIC_DEVIS_LINK_SECRET` absent |

---

## 🟠 Améliorations recommandées (prioritaires)

### 1. Photos stockées en base64 dans la DB
**Gravité : MOYENNE**

Les photos de chantier sont converties en base64 et stockées dans le champ JSON `photos` de la table `Devis`.

**Problème :**
- Une photo de 5 Mo devient ~7 Mo en base64
- La base de données grossit vite
- Les requêtes deviennent lentes
- La facture de la base de données augmente

**Solution recommandée :** Utiliser un CDN (Vercel Blob Storage, Cloudinary, ou AWS S3) et ne stocker que l'URL dans la DB.

### 2. Lignes de devis stockées en JSON brut
**Gravité : MOYENNE**

Les lignes de devis sont stockées dans un champ JSON au lieu d'être normalisées dans une table séparée.

**Problème :**
- Pas de contraintes d'intégrité sur les données (prix, quantités)
- Impossible de faire des requêtes SQL sur les lignes individuelles
- Difficile d'analyser les données à grande échelle

**Solution recommandée :** Créer une table `LigneDevis` avec une relation vers `Devis`.

### 3. Champ `devisRef` déprécié
**Gravité : BASSE**

Le champ `devisRef` (String?) dans la table `Facture` est marqué comme `@deprecated` mais est toujours présent. Il peut être nettoyé après migration des données.

---

## ✅ Ce qui est bien fait

| Fonctionnalité | Pourquoi c'est bien |
|----------------|---------------------|
| 🔐 Auth Clerk | Sécurisé, simple, multilingue |
| 📱 Mobile-first | L'artisan utilise le tel sur le chantier |
| 🤖 IA Gemini | Génération de devis automatique |
| ✍️ Signature électronique | Le client signe depuis son canapé |
| 📊 Dashboard intelligent | Priorités, alertes, objectifs |
| 🌙 Dark mode | Repos pour les yeux le soir |
| 🎯 Tour interactif | Guidage pour les nouveaux |
| 📧 Emails HTML | Design professionnel |
| 🔄 Warmup prospection | Anti-spam intelligent |
| 🛡️ Headers sécurité | HSTS, CSP, COOP, COEP, CORP |
| 🔑 Tokens devis | HMAC-SHA256 + expiration 7 jours + timing-safe |
| 🧪 Tests unitaires | 67 tests couvrant les modules critiques |
| 📄 PDF professionnel | Génération propre avec palettes personnalisées |
| 🏗️ Architecture propre | Code bien structuré, types TypeScript stricts |

---

## 📊 Couverture des tests

| Module | Tests | Statut |
|--------|-------|--------|
| `prospecting.ts` | 10 | ✅ |
| `public-devis-token.ts` | 4 | ✅ |
| `company.ts` | 4 | ✅ |
| `document-number.ts` | 6 | ✅ |
| `trades.ts` | 16 | ✅ |
| `prestations.ts` | 13 | ✅ |
| **Total** | **67** | **✅ Tous passent** |

---

## 🎯 Prochaines étapes recommandées

1. **MOYEN** — Migrer les photos vers un CDN (Vercel Blob ou Cloudinary)
2. **MOYEN** — Normaliser les lignes de devis dans une table dédiée (si besoin d'analytiques)
3. **BASSE** — Nettoyer le champ `devisRef` déprécié
4. **BASSE** — Ajouter des tests d'intégration pour les routes API

---

*Rapport mis à jour par Kael ⛓️ — 26 mars 2026*

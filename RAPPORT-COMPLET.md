# 📋 Rapport Complet — Zolio (Expliqué simplement)

**Date :** 25 mars 2026  
**Site :** https://zolio-saas.vercel.app  
**Code :** https://github.com/LSSHRT/zolio-saas  

---

## 🤔 C'est quoi Zolio en simple ?

Imagine que tu es un artisan (peintre, plombier, électricien…). Tu vas chez un client, tu regardes les travaux, tu fais un devis sur un bout de papier, tu le renvoies par email, tu attends la signature, et après tu fais la facture. C'est long, c'est chiant, c'est le soir que tu fais ça.

**Zolio fait tout ça pour toi en une seule app :**

1. 📝 Tu crées un devis en quelques minutes
2. ✍️ Le client le signe directement sur son téléphone (comme une signature iPad chez Apple)
3. 🧾 Tu transformes le devis en facture d'un clic
4. 📊 Tu vois combien tu as gagné ce mois-ci

C'est un **SaaS** — en français, un "logiciel en ligne". Tu paies un abonnement mensuel, tu te connectes, et tout est là.

---

## 🏗️ Comment c'est construit ? (Les briques du projet)

Ton projet, c'est comme une **maison**. Chaque "technologie" est un mur, un étage, ou une pièce :

### 🧱 Les fondations — Next.js
**C'est quoi ?** Le squelette de la maison.  
**Analogie :** Si ton site était une maison, Next.js serait le plan d'architecte + les murs + la plomberie. Il dit "voici où va chaque page, comment les données circulent, comment le site se charge".

Next.js est créé par **Vercel** (la boîte qui héberge ton site). C'est comme un architecte super populaire — beaucoup de sites l'utilissent (Netflix, TikTok, Nike…).

### ⚛️ La décoration intérieure — React
**C'est quoi ?** Ce qui rend les pages interactives.  
**Analogie :** Quand tu cliques sur un bouton et que quelque chose se passe sans recharger toute la page — c'est React qui fait ça. C'est le "peintre en bâtiment" du web : il rend tout beau et réactif.

### 🗄️ La cave (données) — PostgreSQL + Prisma
**C'est quoi ?** Où sont stockées TES données (clients, devis, factures…).  
**Analogie :** 
- **PostgreSQL** = le grand classeur géant dans la cave. Il stocke tout : tes clients, tes devis, tes factures, les signatures.
- **Prisma** = le bibliothécaire qui va chercher les dossiers dans le classeur. Au lieu de parler directement au classeur (langage SQL compliqué), tu parles à Prisma en langage simple.

**Où ça tourne ?** Probablement sur **Vercel Postgres** ou **Supabase** (hébergé dans le cloud).

### 🔐 La porte d'entrée — Clerk (Authentification)
**C'est quoi ?** Le système de connexion.  
**Analogie :** C'est le vigile à l'entrée. Il vérifie que c'est bien toi qui te connectes (email + mot de passe, ou Google, ou Apple). Sans lui, n'importe qui pourrait voir tes devis.

**Pourquoi c'est bien :** Clerk gère aussi le "rôle" des utilisateurs (tu es admin, tes clients ne le sont pas).

### 💳 La caisse — Stripe
**C'est quoi ?** Le système de paiement pour les abonnements.  
**Analogie :** Quand quelqu'un veut payer pour Zolio Pro, c'est Stripe qui prend la carte bancaire, vérifie que le paiement passe, et dit à l'app "ok, cet utilisateur a payé".

Stripe est ultra fiable — c'est lui qui gère les paiements de Amazon, Shopify, Booking.com…

### 🤖 L'assistant IA — Google Gemini
**C'est quoi ?** L'intelligence artificielle qui génère les devis.  
**Analogie :** Tu décris les travaux en une phrase ("Pose de 20m² de carrelage dans la salle de bain") et l'IA te sort automatiquement les lignes du devis avec les quantités, les prix, les unités.

**Comment ça marche :** Ton app envoie la description à Google, Google analyse avec son IA Gemini, et renvoie un devis structuré. C'est comme avoir un assistant qui connaît les prix du BTP.

### 📧 Le facteur — Nodemailer
**C'est quoi ?** Le système d'envoi d'emails.  
**Analogie :** Quand tu crées un devis, Zolio l'envoie par email au client avec le PDF en pièce jointe. Nodemailer fait le travail d'aller déposer l'email dans la boîte mail du client.

### 🎨 Le papier peint — Tailwind CSS
**C'est quoi ?** Ce qui rend tout joli.  
**Analogie :** Si React est le peintre, Tailwind est sa palette de couleurs. Au lieu de mélanger les couleurs à chaque fois, Tailwind te donne des pots prêts à l'emploi : "bg-violet-500", "text-white", "rounded-2xl"…

---

## 📂 La structure du projet (Expliquée)

Imagine le dossier du projet comme les **pièces de ta maison** :

```
zolio-saas/
│
├── src/                          ← Tout le code est ici
│   ├── app/                      ← Les PAGES de ton site
│   │   ├── page.tsx              ← Page d'accueil (landing)
│   │   ├── dashboard/            ← Le tableau de bord (ce que voit l'artisan)
│   │   ├── devis/                ← Liste des devis
│   │   ├── nouveau-devis/        ← Créer un devis (avec l'IA !)
│   │   ├── factures/             ← Liste des factures
│   │   ├── clients/              ← Gestion des clients
│   │   ├── catalogue/            ← Catalogue de prestations
│   │   ├── parametres/           ← Réglages de l'entreprise
│   │   ├── abonnement/           ← Page d'abonnement (Stripe)
│   │   ├── admin/                ← Panel admin (pour toi Val)
│   │   ├── signer/               ← Page de signature pour le client
│   │   └── api/                  ← Les "portes dérobées" qui traitent les données
│   │       ├── devis/            ← Créer, lire, modifier des devis
│   │       ├── factures/         ← Gérer les factures
│   │       ├── clients/          ← Gérer les clients
│   │       ├── stripe/           ← Gérer les paiements
│   │       ├── ai/               ← L'IA qui génère les devis
│   │       ├── cron/             ← Le robot de prospection automatique
│   │       └── webhooks/         ← Écouter les événements Stripe
│   │
│   ├── components/               ← Les "briques" réutilisables
│   │   ├── LandingPage.tsx       ← La page d'accueil publique
│   │   ├── DashboardChart.tsx    ← Le graphique du dashboard
│   │   ├── client-shell.tsx      ← Le cadre commun (sidebar, navigation)
│   │   └── ...                   ← D'autres composants
│   │
│   └── lib/                      ← Les "outils" partagés
│       ├── prisma.ts             ← Connexion à la base de données
│       ├── company.ts            ← Lire les infos de l'entreprise
│       ├── generatePdf.ts        ← Générer les PDF (devis, factures)
│       ├── sendEmail.ts          ← Envoyer les emails
│       ├── http.ts               ← Gérer les erreurs proprement
│       └── trades.ts             ← Les métiers du BTP (peintre, plombier...)
│
├── prisma/
│   └── schema.prisma             ← Le plan de la base de données
│
└── public/                       ← Les images, icônes, etc.
```

---

## 🔄 Le cycle de vie d'un devis (Comment ça marche concrètement)

Voici ce qui se passe quand un artisan crée un devis :

```
1. 🖥️ L'artisan clique "Nouveau devis" sur son dashboard
   │
   ▼
2. 👤 Il choisit un client (ou en crée un nouveau)
   │
   ▼
3. ✍️ Il remplit les lignes du devis :
   - "Pose carrelage 20m²" → 20 × 35€ = 700€
   - "Fourniture colle" → 1 × 45€ = 45€
   │
   ▼ (optionnel) 🤖 L'IA peut générer les lignes pour lui
   │
   ▼
4. 💾 Le devis est SAUVÉ dans la base de données PostgreSQL
   │
   ▼
5. 📄 Un PDF est généré (avec le logo, les couleurs, le SIRET...)
   │
   ▼
6. 📧 Un email est envoyé au client avec le PDF en pièce jointe
   │
   ▼
7. 🔗 Le client reçoit un lien spécial pour SIGNER le devis
   │
   ▼
8. ✍️ Le client clique le lien, voit le devis, signe avec son doigt
   │
   ▼
9. 🎉 Le devis passe en "Accepté", un email de confirmation est envoyé
   │
   ▼
10. 🧾 L'artisan peut convertir le devis en FACTURE
```

---

## 🛡️ La sécurité (Comment c'est protégé)

### ✅ Ce qui est bien protégé

**1. La porte d'entrée (Clerk)**
- Chaque page vérifie que tu es connecté
- Les pages publiques (landing, signature) sont les seules ouvertes
- Le middleware bloque tout ce qui n'est pas autorisé

**2. Les tokens de signature**
- Quand un client reçoit un lien pour signer, le lien contient un "jeton" (token)
- Ce jeton est signé avec une clé secrète (comme un cachet de cire sur une lettre)
- Il expire après 7 jours
- Il est vérifié de manière "timing-safe" (impossible de deviner la signature en mesurant le temps de réponse)

**3. Le paiement (Stripe)**
- Les webhooks Stripe vérifient la signature (impossible de faire un faux paiement)
- Les clés bancaires ne passent jamais par ton serveur (c'est Stripe qui gère)

**4. Les headers de sécurité**
- Ton site dit aux navigateurs "ne me chargez pas dans un iframe" (anti-clickjacking)
- Il interdit les plugins Flash/Java (anti-malware)
- Il a un Content Security Policy (CSP) qui limite les sources de scripts

### ⚠️ Ce qui pourrait être mieux

**1. Le fallback de secret**
Dans le code des tokens de devis, si la clé secrète n'est pas configurée, le code utilise la clé de Clerk à la place. C'est comme utiliser la même clé pour ta maison ET ton bureau — pas idéal.

**2. Pas de HSTS**
Ton site ne dit pas "toujours utiliser HTTPS". Un attaquant pourrait forcer un utilisateur en HTTP (non sécurisé).

**3. Les photos dans la base de données**
Les photos des chantiers sont stockées en base64 dans la base. C'est comme stocker des photos imprimées dans un classeur — ça prend beaucoup de place et c'est lent.

---

## 🤖 Le robot de prospection (Fonctionnalité cool mais risquée)

### C'est quoi ?
Zolio a un **robot automatique** qui trouve des artisans sur internet et leur envoie des emails pour leur présenter l'outil.

### Comment ça marche ?
```
1. Le robot se réveille à certaines heures (grâce à un "cron" sur Vercel)
2. Il cherche sur Bing des artisans (ex: "peintre Paris artisan site:.fr")
3. Il utilise Hunter.io pour trouver les emails de ces artisans
4. Il envoie un email de présentation
5. Il sauvegarde les résultats dans la base
```

### Le système de "warmup" (Échauffement)
Comme Gmail et les autres bloquent les spams, le robot ne peut pas envoyer 100 emails d'un coup. Il commence doucement :
- Jour 1 : 5 emails
- Jour 2 : 8 emails
- ...augmente progressivement jusqu'à la limite quotidienne

### ⚠️ Attention
C'est de la **prospection commerciale** (cold emailing). En France, c'est légal pour les pros (B2B) mais il faut :
- Un lien de désinscription
- Ne pas envoyer trop souvent
- Respecter le RGPD

---

## 🐛 Les problèmes que j'ai trouvés

### 🔴 Problème 1 : Fichiers qui traînent dans le code

**En simple :** Ton garage est plein de vieux outils que tu n'utilises plus.

**Détail :** Il y a des fichiers comme :
- `.next_stale_1773961558/` → Un ancien cache corrompu (40+ fichiers)
- `add_indexes.js`, `patch_errors.js`, `fix_siret.js`... → Des scripts de debug que tu as lancés une fois
- `current_landing.tsx` → Une ancienne version de ta page d'accueil

**Pourquoi c'est un problème :**
- Ça alourdit le déploiement (Vercel doit tout traiter)
- Ça expose la structure de ton code à n'importe qui
- C'est comme laisser des documents sensibles traîner dans un café

**Solution :** Les supprimer ou les mettre dans un dossier `scripts/` avec un `.gitignore` adapté.

---

### 🟠 Problème 2 : Les photos stockées dans la base de données

**En simple :** Tu stockes des photos de chantier dans un classeur papier.

**Détail :** Quand un artisan ajoute des photos à un devis, elles sont converties en base64 (du texte qui représente l'image) et stockées directement dans la base PostgreSQL.

**Pourquoi c'est un problème :**
- Une photo de 5 Mo devient ~7 Mo en base64
- La base de données grossit vite
- Les requêtes deviennent lentes
- La facture de la base de données augmente

**Solution idéale :** Utiliser un **CDN** (Content Delivery Network) comme :
- Vercel Blob Storage
- Cloudinary
- AWS S3

Tu stockes juste l'**URL** de la photo dans la base, pas la photo elle-même.

---

### 🟠 Problème 4 : Pas de relation entre Devis et Facture

**En simple :** Tu as un dossier "Devis" et un dossier "Factures" mais aucune ficelle qui les relie.

**Détail :** Dans la base de données, le champ `devisRef` dans la table `Facture` est juste un texte libre. Il n'y a pas de vraie relation qui dit "cette facture vient de CE devis".

**Pourquoi c'est un problème :** Si tu veux savoir "quel devis a généré cette facture ?", c'est compliqué. Et si tu supprimes un devis, la facture orpheline reste.

**Solution :** Ajouter une vraie relation Prisma entre Devis et Facture.

---

### 🟡 Problème 5 : Types "any" dans le code

**En simple :** Quelques endroits dans le code disent "je sais pas ce que c'est, mais ça marche".

**Détail :** Dans les erreurs Stripe, le code utilise `any` au lieu de types stricts. C'est comme dire "c'est un truc" au lieu de "c'est un chat".

**Pourquoi c'est un problème :** Si une erreur se produit, TypeScript ne peut pas t'aider à comprendre ce qui s'est passé. C'est un risque caché.

---

### 🟡 Problème 6 : Import Analytics sous-optimal

**En simple :** Tu utilises la mauvaise prise pour brancher un appareil.

**Détail :** Dans le code, l'import de Vercel Analytics utilise `@vercel/analytics/react` au lieu de `@vercel/analytics/next`. La version `/next` est optimisée pour Next.js.

**Impact :** Mineur, mais c'est une bonne pratique.

---

## 📊 Résumé des problèmes

| # | Gravité | Problème | En simple |
|---|---------|----------|-----------|
| 1 | 🔴 | Fichiers qui traînent | Garage encombré |
| 2 | 🟠 | Photos dans la DB | Photos dans un classeur |
| 3 | 🟠 | Pas de relation Devis→Facture | Dossiers non reliés |
| 4 | 🟡 | Types any TypeScript | "Je sais pas ce que c'est" |
| 5 | 🟡 | Import Analytics | Mauvaise prise |

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
| 🛡️ CSP Headers | Protection contre les attaques |

---

## 🎯 Ce qu'il faut faire maintenant

### Priorité 1 — Urgent (aujourd'hui)
1. Nettoyer les fichiers qui traînent

### Priorité 2 — Important (cette semaine)
2. Stocker les photos dans un CDN
3. Ajouter la relation Devis→Facture
4. Ajouter HSTS (sécurité HTTPS)

### Priorité 3 — Amélioration (ce mois)
6. Corriger les types any
7. Corriger l'import Analytics
8. Ajouter des tests automatisés

---

*Rapport généré par Esclave ⛓️ — Ton assistant dev*

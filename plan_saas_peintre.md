# Plan du Projet SaaS - Zolio (Outil de Devis pour Peintres)

## 1. Vision et Objectifs
Créer une application SaaS (Software as a Service) 100% automatisée permettant aux peintres décorateurs de générer des devis depuis leur smartphone.
**Contraintes principales :** 0€ d'investissement initial (hors nom de domaine), sécurité maximale (notamment bancaire), et simplicité d'utilisation pour des artisans sur le terrain.

## 2. Architecture Technique (Stack "Zéro Budget")
Pour respecter la contrainte de coût de lancement nul, voici la stack recommandée :

* **Frontend (Application Mobile / Web)** : `Next.js` (React) avec `TailwindCSS` en tant que PWA (Progressive Web App) pour une utilisation fluide et native sur téléphone sans passer par les App Stores (ce qui évite les commissions de 30% d'Apple/Google).
* **Hébergement** : `Vercel` ou `Netlify` (100% gratuit pour commencer).
* **Base de données / Logique Métier** : `Google Sheets` (comme demandé, intégré via API). *Alternative plus robuste pour la suite si l'app grandit : `Supabase`.*
* **Automatisation (Génération PDF & Emails)** : `Google Apps Script` ou un service comme `Make` (version gratuite). Dès que la ligne est ajoutée sur Sheets, un PDF est généré à partir d'un modèle et envoyé via Gmail au client.
* **Paiement & Sécurité** : `Stripe`. C'est la norme mondiale. **Aucun frais fixe**, seulement une commission par transaction. Stripe prend en charge 100% de la norme PCI-DSS. **Aucune donnée de carte n'est stockée sur nos serveurs**, le risque de fuite de données bancaires de notre côté est techniquement impossible, tout est crypté chez eux.

## 3. Fonctionnalités de l'Application (MVP)
- [ ] **Gestion des Clients (Mini-CRM)** : Enregistrement et auto-complétion (Nom, Email, Téléphone, Adresse).
- [ ] **Catalogue de Prestations Dynamique** :
  - Sélection de prestations prédéfinies (ex: Peinture acrylique murale 2 couches).
  - Possibilité de rajouter une prestation personnalisée à la volée.
- [ ] **Calculateur de Prix** :
  - L'artisan rentre le coût des matériaux.
  - Calcul et application de la marge commerciale.
  - Calcul de la TVA selon le statut, avec Totaux HT / TTC.
- [ ] **Génération & Envoi Auto** :
  - Création du devis PDF instantanément.
  - Envoi automatisé par e-mail au client clôturant l'action de l'artisan.

## 4. Stratégie Marketing & Commercialisation
Pour vendre l'abonnement en limitant les coûts, l'approche doit être directe et organique :
* **Modèle Freemium / Essai Gratuit** : Offrir 14 jours d'essai gratuits ou les "5 premiers devis offerts". L'artisan teste, il voit que ça lui fait gagner 2h par jour : il s'abonne (ex: prix accessible entre 15€ et 29€/mois).
* **Canaux d'Acquisition (Zéro Budget)** :
  * **Prospection directe (Cold Calling/Emailing)** : Extraire les numéros/emails de peintres sur Leboncoin, Google Maps ou Pages Jaunes. Les contacter avec une phrase d'accroche ("J'ai créé un outil pour diviser par 3 le temps de vos devis").
  * **Groupes Facebook BTP & Artisans** : Poster des vidéos de démonstration ("Comment je fais un devis en 30 secondes chrono depuis mon camion").
  * **Bouche-à-oreille et Parrainage** : Un artisan qui s'abonne à la possibilité de débloquer 1 mois gratuit s'il parraine un collègue d'un autre corps de métier (électricien, plombier...).

## 5. Roadmap de Développement (Checklist)
_À cocher au fur et à mesure de notre progression_

### Phase 1 : Maquettage et Structure de Données
- [ ] Définir la structure exacte du fichier Google Sheets (colonnes pour les clients, listes de prix matériaux, log des devis).
- [ ] Créer le modèle de PDF (template visuel).
- [ ] Discuter du design de l'application mobile (couleurs, boutons...).

### Phase 2 : Développement Backend (Le Cerveau)
- [ ] Configurer les accès API Google (Google Cloud Platform).
- [ ] Développer le script d'automatisation (Insertion Sheets -> Génération PDF -> Envoi Email).

### Phase 3 : Développement Frontend (L'Interface Artisan)
- [ ] Mettre en place la page de connexion de l'artisan.
- [ ] Développer le formulaire optimisé pour smartphone (Ajout client + Ajout prestation + Calcul).
- [ ] Lier l'interface applicative à l'API Google Sheets.

### Phase 4 : Stripe, Déploiement & Lancement
- [ ] Intégrer l'API Stripe pour gérer les abonnements des peintres (Checkout).
- [ ] Acheter le nom de domaine (seul investissement).
- [ ] Déployer l'application et réaliser les tests finaux.

## 6. Identité Visuelle & Branding

### Nom et Domaine : Zolio
- **Nom retenu** : Zolio (Sonne tech, fluide, moderne).
- **Nom de domaine** : `zolio.site`

### Concept de Logo
- **Style** : Abstrait, premium, et minimaliste (style startup de la Silicon Valley).
- **Couleurs** : Des dégradés vibrants (ex: Bleu nuit vers Cyan, ou Violet vers Orange) pour ne pas faire "BTP classique" (orange/jaune/noir) et se démarquer comme un vrai logiciel haut de gamme.
- **Forme** : Une icône géométrique (ex: un cercle fluide, ou une forme dynamique) qui servira d'icône d'application mobile sur l'écran d'accueil de l'artisan.

---
*Ce document sera mis à jour à chaque grande étape. Dès que tu es prêt, dis-moi par quelle phase tu souhaites commencer !*

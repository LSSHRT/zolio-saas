# 📅 Relances automatiques — Cron API

## Architecture

Le cron Vercel appelle chaque jour `/api/cron/invoice-reminders` (configuré dans `vercel.json`).

### Route

- **Endpoint:** `GET /api/cron/invoice-reminders`
- **Auth:** Header `Authorization: Bearer <CRON_SECRET>`
- **Schedule:** `0 8 * * *` (tous les jours à 8h UTC → 10h Paris heure d'hiver / 9h heure d'été)

### Logique métier

1. Récupère toutes les factures avec `statut = "Émise"` ET `dateEcheance < maintenant` ET `emailClient != null`
2. Filtre les factures en retard de **au moins 3 jours** (on laisse un petit délai de grâce)
3. Pour chaque facture éligible :
   - Envoie un email au client avec N° facture, montant, date d'échéance, jours de retard
   - Marque la facture pour ne pas renvoyer (pas de spam de rappels)

### Emails envoyés

- **À :** `client.email` (l'email du client sur la facture)
- **Sujet :** `Rappel – Facture F-XXXX`
- **Contenu :** N° facture, date création, montant TTC, échéance, jours de retard

### Sécurité

- Protected by `CRON_SECRET` env var
- Vercel Cron ajoute automatiquement ce header via la config `vercel.json`

### Limites actuelles

- ❌ Pas de relecture par l'artisan — le rappel part direct chez le client
- ❌ Pas de relance progressive (J+3, J+7, J+15)
- ❌ Pas de webhook de confirmation de lecture
- ✅ Idéalement : ajouter `reminderCount` et `lastReminderAt` dans le modèle `Facture`


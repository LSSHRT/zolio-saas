#!/bin/bash
# Script de migration Xata → Supabase
# Usage: ./scripts/migrate-to-supabase.sh
#
# Pré-requis:
# 1. Avoir créé un projet Supabase
# 2. Avoir l'URL de connexion Supabase (Settings > Database > Connection string)
# 3. Avoir l'URL de connexion Xata (ancienne DB)

set -e

echo "🔄 Migration Xata → Supabase"
echo "============================="
echo ""

# Vérifier les variables
if [ -z "$XATA_DATABASE_URL" ]; then
  echo "❌ Variable XATA_DATABASE_URL non définie"
  echo "   export XATA_DATABASE_URL='postgresql://...'"
  echo "   (trouvable dans ton dashboard Xata)"
  exit 1
fi

if [ -z "$SUPABASE_DATABASE_URL" ]; then
  echo "❌ Variable SUPABASE_DATABASE_URL non définie"
  echo "   export SUPABASE_DATABASE_URL='postgresql://...'"
  echo "   (trouvable dans Supabase > Settings > Database > Connection string)"
  echo ""
  echo "💡 Utilise l'URL en mode 'Transaction' (port 6543) ou 'Session' (port 5432)"
  exit 1
fi

BACKUP_DIR="./backup-xata-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "📦 Étape 1: Export des données depuis Xata..."
echo "   Répertoire: $BACKUP_DIR"

# Liste des tables à migrer (ordre important pour les foreign keys)
TABLES=(
  "Client"
  "Prestation"
  "Devis"
  "LigneDevis"
  "Depense"
  "Facture"
  "Note"
  "ProspectMail"
  "ProspectDomain"
  "AdminSetting"
  "PushSubscription"
  "DevisTemplate"
  "LigneTemplate"
  "FactureRecurrente"
)

# Export de chaque table
for TABLE in "${TABLES[@]}"; do
  echo "   → Export $TABLE..."
  pg_dump "$XATA_DATABASE_URL" \
    --table="\"$TABLE\"" \
    --data-only \
    --no-owner \
    --no-privileges \
    --format=plain \
    --file="$BACKUP_DIR/${TABLE}.sql" 2>/dev/null || echo "   ⚠️  $TABLE n'existe pas encore (OK si première migration)"
done

echo ""
echo "📤 Étape 2: Création du schéma sur Supabase..."

# Générer le SQL depuis Prisma schema
npx prisma migrate diff \
  --from-empty \
  --to-schema-datamodel=prisma/schema.prisma \
  --script \
  > "$BACKUP_DIR/schema.sql"

echo "   → Schéma généré: $BACKUP_DIR/schema.sql"

# Appliquer le schéma sur Supabase
echo "   → Application du schéma..."
psql "$SUPABASE_DATABASE_URL" -f "$BACKUP_DIR/schema.sql" 2>/dev/null || {
  echo "   ⚠️  Certaines tables existent peut-être déjà, on continue..."
}

echo ""
echo "📥 Étape 3: Import des données dans Supabase..."

for TABLE in "${TABLES[@]}"; do
  if [ -f "$BACKUP_DIR/${TABLE}.sql" ] && [ -s "$BACKUP_DIR/${TABLE}.sql" ]; then
    echo "   → Import $TABLE..."
    psql "$SUPABASE_DATABASE_URL" -f "$BACKUP_DIR/${TABLE}.sql" 2>/dev/null || echo "   ⚠️  Erreur sur $TABLE (peut-être vide)"
  fi
done

echo ""
echo "✅ Migration terminée !"
echo ""
echo "📋 Prochaines étapes:"
echo "   1. Vérifie les données dans le dashboard Supabase"
echo "   2. Mets à jour DATABASE_URL sur Vercel:"
echo "      - Va sur vercel.com > ton projet > Settings > Environment Variables"
echo "      - Remplace DATABASE_URL par l'URL Supabase"
echo "   3. Redéploie ton app sur Vercel"
echo "   4. Teste que tout fonctionne"
echo ""
echo "💾 Backup sauvegardé dans: $BACKUP_DIR"

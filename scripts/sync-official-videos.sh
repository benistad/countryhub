#!/bin/bash

# Script de synchronisation quotidienne des vidéos officielles
# Usage: ./sync-official-videos.sh
# Peut être ajouté à un cron job système ou GitHub Actions

# Configuration
SUPABASE_URL="https://lkrintwlenbmtohilmrs.supabase.co"
FUNCTION_URL="$SUPABASE_URL/functions/v1/sync-official-videos"

# Service Role Key (à configurer via variable d'environnement)
if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Erreur: SUPABASE_SERVICE_ROLE_KEY non définie"
    echo "Définissez la variable: export SUPABASE_SERVICE_ROLE_KEY='votre_clé'"
    exit 1
fi

# Paramètres de synchronisation
HOURS=${1:-24}  # Récupérer les vidéos des dernières 24h par défaut
MAX_RESULTS=${2:-10}  # Max 10 vidéos par chaîne par défaut

echo "🚀 Démarrage de la synchronisation des vidéos officielles..."
echo "📅 Période: dernières $HOURS heures"
echo "📺 Max vidéos par chaîne: $MAX_RESULTS"

# Appel de l'Edge Function
RESPONSE=$(curl -s -X POST \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -d "{\"hours\": $HOURS, \"maxResultsPerChannel\": $MAX_RESULTS}" \
  "$FUNCTION_URL")

# Vérification du résultat
if [ $? -eq 0 ]; then
    echo "✅ Synchronisation terminée"
    echo "📊 Résultat: $RESPONSE"
else
    echo "❌ Erreur lors de la synchronisation"
    echo "🔍 Réponse: $RESPONSE"
    exit 1
fi

# Optionnel: Log dans un fichier
LOG_FILE="$(dirname "$0")/../logs/sync-official-videos.log"
mkdir -p "$(dirname "$LOG_FILE")"
echo "$(date): $RESPONSE" >> "$LOG_FILE"

echo "🎉 Synchronisation des vidéos officielles terminée avec succès !"

#!/usr/bin/env bash
# Restauration d'un dump Postgres sur une instance (procédure testée Phase 8).
# Usage : DATABASE_URL=postgres://... ./scripts/restore.sh <fichier.dump>
set -euo pipefail

FILE="${1:?Chemin du dump requis}"
: "${DATABASE_URL:?DATABASE_URL requis}"
[ -f "$FILE" ] || { echo "Fichier introuvable : $FILE"; exit 1; }

echo "⚠ Restauration de $FILE vers la base cible (les données existantes seront écrasées)."
pg_restore --clean --if-exists --no-owner --dbname="$DATABASE_URL" "$FILE"
echo "✓ Restauration terminée."

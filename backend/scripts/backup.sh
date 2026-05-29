#!/usr/bin/env bash
# Sauvegarde Postgres planifiée (complément des snapshots du PaaS).
# Usage : DATABASE_URL=postgres://... ./scripts/backup.sh [dossier_sortie]
set -euo pipefail

OUT_DIR="${1:-./backups}"
mkdir -p "$OUT_DIR"
STAMP="$(date +%Y%m%d_%H%M%S)"
FILE="$OUT_DIR/ipck_${STAMP}.dump"

: "${DATABASE_URL:?DATABASE_URL requis}"

echo "→ Dump de la base vers $FILE"
pg_dump --format=custom --no-owner --dbname="$DATABASE_URL" --file="$FILE"
echo "✓ Sauvegarde créée : $FILE ($(du -h "$FILE" | cut -f1))"

# Rétention : conserver les 14 derniers dumps
ls -1t "$OUT_DIR"/ipck_*.dump 2>/dev/null | tail -n +15 | xargs -r rm -f
echo "✓ Rétention appliquée (14 derniers dumps conservés)"

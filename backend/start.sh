#!/bin/sh
# Démarrage prod (Railway/Docker) : migrations Prisma PUIS l'API.
# Le && est ici DANS un vrai shell → toujours interprété correctement
# (contrairement à un startCommand Railway exécuté sans shell).
set -e
echo ">>> [start.sh] prisma migrate deploy"
node node_modules/prisma/build/index.js migrate deploy
echo ">>> [start.sh] starting NestJS (node dist/main.js)"
exec node dist/main.js

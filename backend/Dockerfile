# ---- Build ----
FROM node:22-slim AS build
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@11.1.2 --activate

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

COPY prisma ./prisma
RUN pnpm prisma:generate

COPY . .
RUN pnpm build

# ---- Runtime ----
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY package.json ./

# Dossier des vidéos auto-hébergées servies sur /media (vide par défaut ;
# en prod, montez un Volume Railway sur /app/media pour la persistance,
# ou pointez videoUrl vers un stockage objet S3/R2). Voir DEPLOY.md.
RUN mkdir -p media/videos

EXPOSE 3000
# Applique les migrations puis démarre l'API
CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && node dist/main.js"]

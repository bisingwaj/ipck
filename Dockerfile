# ─────────────────────────────────────────────────────────────────────────
# Dockerfile RACINE pour Railway (monorepo) — build du backend NestJS.
# Permet à Railway de déployer le backend SANS régler le "Root Directory"
# (il scanne la racine, trouve ce Dockerfile via railway.json → builder DOCKERFILE).
# Vercel (Root=IPCKAdmin) et EAS ignorent ce fichier.
# ─────────────────────────────────────────────────────────────────────────

# ---- Build ----
FROM node:22-slim AS build
WORKDIR /app
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*
RUN corepack enable && corepack prepare pnpm@11.1.2 --activate

COPY backend/package.json backend/pnpm-lock.yaml backend/pnpm-workspace.yaml backend/.npmrc ./
RUN pnpm install --frozen-lockfile

COPY backend/prisma ./prisma
RUN pnpm prisma:generate

COPY backend/ ./
RUN pnpm build

# ---- Runtime ----
FROM node:22-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production
RUN apt-get update -y && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY backend/package.json ./

# Dossier des vidéos servies sur /media (vide par défaut ; voir DEPLOY.md pour la persistance)
RUN mkdir -p media/videos

EXPOSE 3000
# Migrations Prisma puis API — via start.sh (le && est dans un vrai shell, fiable)
CMD ["sh", "start.sh"]

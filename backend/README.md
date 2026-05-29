# IPCK Backend

API NestJS + Prisma (PostgreSQL 16) + Redis 7 pour la plateforme IPCK.

## Démarrage rapide

```bash
# 1. Depuis la racine du dépôt : lancer Postgres + Redis
docker compose up -d

# 2. Backend
cd backend
cp .env.example .env
pnpm install
pnpm prisma:generate
pnpm prisma:migrate        # crée la base et applique les migrations
pnpm dev                   # API sur http://localhost:3000

# 3. Vérifier
curl http://localhost:3000/health        # { "status": "ok", "db": "up", "redis": "up" }
# Swagger : http://localhost:3000/docs
```

## Scripts

| Script | Rôle |
| --- | --- |
| `pnpm dev` | Démarre en watch |
| `pnpm build` / `pnpm start` | Build prod / run `dist` |
| `pnpm lint` / `pnpm format` | ESLint / Prettier |
| `pnpm test` / `pnpm test:cov` | Tests unitaires + couverture |
| `pnpm test:e2e` | Tests e2e (Supertest, nécessite DB+Redis) |
| `pnpm prisma:migrate` | Migration dev |
| `pnpm prisma:deploy` | Migration prod (CI/CD) |
| `pnpm prisma:reset` | Reset base + migrations |
| `pnpm seed` | Seed de démo |

## Architecture

```
src/
├── main.ts                 # Bootstrap (CORS, ValidationPipe, Swagger /docs, prefix api/v1)
├── app.module.ts
├── config/                 # Config typée + validation Zod au démarrage
├── prisma/                 # PrismaService (+ module global)
├── redis/                  # RedisService ioredis (+ module global)
└── health/                 # GET /health (ping DB + Redis)
```

Voir [`../docs/api-spec.md`](../docs/api-spec.md) pour le contrat d'API complet.

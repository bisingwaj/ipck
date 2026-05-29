# Changelog

## v1.0.0 — Backend IPCK & préparation production

Première version du backend IPCK et de la chaîne de mise en production (BACKEND_PLAN, phases 1→10).

### Backend (`backend/`)
- API NestJS 11 + Prisma 6 (PostgreSQL 16) + Redis 7, préfixe `/api/v1`, OpenAPI sur `/docs`.
- Auth **téléphone + OTP** (Redis, rate-limité) → **JWT** access/refresh avec rotation & révocation.
- **RBAC** (`member`/`group_leader`/`pastor`/`admin`) via guards globaux.
- Domaines : devotionals (streak), sermons + **live (WebSocket, amens)**, groups + chat, prayers (mur + file de care), events (RSVP), **giving** (dons + wallet « Amen coins » + webhooks signés), appointments, notifications (push Expo), admin (KPIs), activity, reference.
- Abstractions interchangeables : SMS (console/Twilio), paiement (mock/FlexPay/Stripe, signature HMAC).
- Sécurité : helmet, CORS strict, throttler global, logs structurés pino, validation des entrées.
- Tests : **14 unitaires + 14 e2e** verts ; lint 0 warning.

### Dashboard (`IPCKAdmin/`)
- Nouveau dashboard **Vite + React + TS + IBM Carbon** branché sur l'API (auth staff OTP).
- Panneaux : Overview (KPIs), Care (prières + RDV), Giving (analytics).

### Outillage
- `docker-compose.yml` (Postgres + Redis), `.env.example`, seed reproductible + comptes démo.
- CI/CD GitHub Actions (backend, dashboard, EAS mobile) ciblant Railway.
- Dockerfile multi-stage + `railway.json` ; scripts backup/restore/smoke ; Dependabot.
- Docs : `api-spec`, `screen-endpoint-matrix`, `openapi`, `mobile-integration`, `e2e-plan`, `DEMO`, `PRODUCTION` + collection Postman.

### Non inclus (nécessite comptes/secrets de l'équipe)
- Déploiement Railway réel, builds EAS cloud, soumission stores, providers réels (Twilio/FlexPay/Stripe/Sentry) — préparés via configs et variables, activables sans changement de code.

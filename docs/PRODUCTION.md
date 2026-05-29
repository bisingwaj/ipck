# docs/PRODUCTION.md — Mise en production (Phase 10, cible Railway)

## 1. Architecture de déploiement

| Service | Plateforme | Notes |
| --- | --- | --- |
| Backend API | **Railway** (Dockerfile) | `backend/Dockerfile` ; healthcheck `/health` ; `prisma migrate deploy` au boot |
| PostgreSQL 16 | Railway plugin | fournit `DATABASE_URL` |
| Redis 7 | Railway plugin | fournit `REDIS_URL` |
| Dashboard | Railway (static) ou Vercel | `IPCKAdmin/` → `vite build` → `dist/` servi statiquement |
| Mobile | EAS (AAB/IPA) | profils `production` (Play / App Store) |

## 2. Check-list go-live

- [ ] Projet Railway créé ; services **Postgres** et **Redis** ajoutés (variables injectées automatiquement).
- [ ] Service backend : « Deploy from repo », root `backend/`, build **Dockerfile** (cf. `backend/railway.json`).
- [ ] **Variables d'environnement prod** définies (chiffrées, jamais dans le dépôt) :
  - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` (forts : `openssl rand -base64 48`)
  - `PAYMENT_WEBHOOK_SECRET`, `CORS_ORIGINS` (domaines réels)
  - `SMS_PROVIDER=twilio` + `TWILIO_*` (ou rester `console`/sandbox, documenté)
  - `PAYMENT_PROVIDER=flexpay|stripe` + clés (ou `mock` en sandbox documenté)
  - `EXPO_ACCESS_TOKEN`, `SENTRY_DSN`, `S3_*` si activés
  - `NODE_ENV=production`, `LOG_LEVEL=info`
- [ ] `DATABASE_URL` / `REDIS_URL` référencent les plugins Railway.
- [ ] **Domaine** + HTTPS (Railway fournit le certificat) ; `CORS_ORIGINS` = domaine du dashboard + app.
- [ ] Secret CI `RAILWAY_TOKEN` configuré (déploiement auto sur `main` via `.github/workflows/backend.yml`).
- [ ] Builds mobiles **EAS production** (`eas build --profile production`) ; `EXPO_PUBLIC_API_URL` = API prod.
- [ ] Sauvegardes : snapshots Railway activés + `backend/scripts/backup.sh` planifié ; restauration testée (`restore.sh`).

## 3. Déploiement

```bash
# Option A — via CI (recommandé) : push sur main déclenche backend.yml + dashboard.yml
git push origin main

# Option B — manuel (Railway CLI)
npm i -g @railway/cli && railway login
cd backend && railway up --service ipck-backend
```

Les migrations Prisma sont appliquées automatiquement au démarrage du conteneur (`migrate deploy`).

## 4. Smoke tests post-déploiement

```bash
BASE_URL=https://<domaine-api> bash backend/scripts/smoke.sh
```

Vérifie `/health`, `/docs`, endpoint public, protection auth (401), demande OTP. Puis :
- Login OTP réel (SMS prod ou sandbox documenté) → un parcours clé (don) de bout en bout.
- Dashboard prod accessible, panneaux sur données réelles.
- Build mobile prod installé sur appareil (Android/iOS).

## 5. Release

```bash
git tag -a v1.0.0 -m "IPCK backend v1.0.0 — démo de production"
git push origin v1.0.0
```

Notes de version : voir [`CHANGELOG.md`](../CHANGELOG.md).

## 6. Rollback

- Backend : redéployer le déploiement Railway précédent (historique des deployments).
- Base : restaurer le dernier dump (`backend/scripts/restore.sh`) sur une instance, basculer `DATABASE_URL`.

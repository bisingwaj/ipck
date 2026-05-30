# Déploiement IPCK

Monorepo avec 3 cibles :

| App | Dossier | Cible | Type |
|---|---|---|---|
| Backend API | `backend/` | **Railway** | NestJS + Postgres + Redis (Docker) |
| Dashboard admin | `IPCKAdmin/` | **Vercel** | Vite/React (statique SPA) |
| App mobile | `IPCKConnectMobile/` | **Expo EAS** | React Native (build natif) |

Repo : `https://github.com/dav24300/IPCK-APP` (branche prod : `main`).

---

## 1. Backend → Railway

Le backend a déjà `Dockerfile` + `railway.json` (build Docker, healthcheck `/health`,
migrations `prisma migrate deploy` au démarrage).

### Étapes
1. **railway.com → New Project → Deploy from GitHub repo** → `dav24300/IPCK-APP`.
2. Sur le service créé : **Settings → Root Directory = `backend`** ⚠️ (monorepo).
   Railway lit alors `backend/railway.json` + `backend/Dockerfile`.
3. **Ajouter les plugins** au projet :
   - **PostgreSQL** → expose `DATABASE_URL`.
   - **Redis** → expose `REDIS_URL`.
   (Railway injecte ces deux variables automatiquement dans le service.)
4. **Variables d'environnement** du service (Settings → Variables) — cf. `backend/.env.example` :
   ```
   NODE_ENV=production
   CORS_ORIGINS=https://VOTRE-DASHBOARD.vercel.app
   JWT_ACCESS_SECRET=<openssl rand -base64 48>
   JWT_REFRESH_SECRET=<openssl rand -base64 48>
   PAYMENT_WEBHOOK_SECRET=<openssl rand -base64 32>
   PAYMENT_PROVIDER=mock          # ou flexpay / stripe quand prêt
   SMS_PROVIDER=console           # ou twilio (+ TWILIO_* )
   DEV_MASTER_OTP=                # VIDE en prod (de toute façon ignoré si NODE_ENV=production)
   LOG_LEVEL=info
   ```
   `DATABASE_URL` et `REDIS_URL` viennent des plugins — ne pas les redéfinir à la main.
5. **Deploy**. Le conteneur applique les migrations puis démarre l'API. Railway fournit
   l'URL publique (ex. `https://ipck-backend-production.up.railway.app`).
   → c'est cette URL **+ `/api/v1`** qui ira dans `VITE_API_URL` (dashboard) et
   `EXPO_PUBLIC_API_URL` (mobile).

### Données initiales (optionnel, une fois)
Le seed n'est PAS lancé automatiquement (il efface les tables). Pour peupler la prod une
seule fois, via Railway CLI : `railway run pnpm seed` (depuis `backend/`).
Sinon, créez le contenu vidéo depuis le dashboard (onglet **Contenus**).

### Vidéos auto-hébergées (`/media`)
Le système de scraping `pnpm fetch:videos` télécharge les MP4 dans `backend/media/videos/`
(non versionnés). En production, le FS Railway est éphémère → deux options :
- **Volume Railway** monté sur `/app/media` (persistant) : y déposer les vidéos une fois.
- **Stockage objet** (Cloudflare R2 / S3, variables `S3_*` déjà prévues) et mettre
  `videoUrl` = l'URL publique du fichier (le lecteur mobile lit toute URL MP4/HLS absolue).
Tant qu'aucune des deux n'est en place, les `videoUrl` relatifs `/media/...` renverront 404
en prod (le reste de l'app fonctionne).

---

## 2. Dashboard → Vercel

Config déjà committée (`IPCKAdmin/vercel.json` + `.env.production`).

1. **vercel.com → Add New → Project → Import** `dav24300/IPCK-APP`.
2. **Root Directory = `IPCKAdmin`** ⚠️. Framework **Vite** (auto). Build/output gérés par `vercel.json`.
3. **Environment Variables** : `VITE_API_URL=https://<backend-railway>/api/v1`
   (ou éditer `IPCKAdmin/.env.production`).
4. **Deploy**. Chaque `git push` sur `main` redéploie automatiquement.
5. Revenir sur Railway → mettre `CORS_ORIGINS=https://<projet>.vercel.app`.

---

## 3. App mobile → Expo EAS (rappel)

- `EXPO_PUBLIC_API_URL=https://<backend-railway>/api/v1`, `EXPO_PUBLIC_USE_MOCKS=false`.
- `eas build --profile production` (les modules natifs `expo-video` nécessitent un build EAS, pas Expo Go).

---

## Checklist post-déploiement
- [ ] Backend Railway en ligne, `/health` OK, `/docs` accessible.
- [ ] `DATABASE_URL` + `REDIS_URL` injectés par les plugins.
- [ ] Secrets JWT/webhook forts, `DEV_MASTER_OTP` vide.
- [ ] Dashboard Vercel pointant sur l'API (VITE_API_URL) ; CORS backend autorise le domaine Vercel.
- [ ] Vidéos : Volume Railway ou stockage objet en place.
- [ ] (CI) Réactiver `.github/workflows/` avec un token ayant le scope `workflow`.

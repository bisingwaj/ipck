# IPCK — Plateforme d'engagement de l'International Protestant Church of Kinshasa

Monorepo de la plateforme numérique **IPCK**, composé de **trois cibles** désormais branchées sur des **données réelles** :

- **IPCK Connect** (`IPCKConnectMobile/`) — application mobile membres (Expo SDK 52 / React Native / TypeScript), branchée sur l'API live.
- **IPCK House / Admin** (`IPCKAdmin/`) — dashboard admin web (Vite + React + TypeScript + IBM Carbon Design System), déployé sur Vercel.
- **Backend** (`backend/`) — API **NestJS 11 + Prisma 6 + PostgreSQL 16 + Redis 7**, **déployée en production** sur Railway (`https://ipck-production.up.railway.app/api/v1`).

> 📄 Documentation associée :
> - [`APP.md`](./APP.md) — architecture technique détaillée des frontends + instructions de build.
> - [`BACKEND_PLAN.md`](./BACKEND_PLAN.md) — plan de construction du backend en 10 phases (référence historique).
> - [`DEPLOY.md`](./DEPLOY.md) — déploiement Railway (backend) + Vercel (dashboard) + EAS (mobile).
> - [`backend/README.md`](./backend/README.md) — démarrage rapide du backend.
> - [`docs/`](./docs/) — spec d'API (`api-spec.md`), OpenAPI, matrice écran↔endpoint, intégration mobile, plan E2E.

---

## ✨ Fonctionnalités

L'app mobile couvre 6 domaines :

| Domaine | Écran | Contenu |
| --- | --- | --- |
| **Today** | `today/` | Dévotion quotidienne (verset, méditation, prière, application), streak, historique |
| **Watch** | `watch/` | Bibliothèque de sermons/contenus + culte en **direct** (`expo-video`, MP4/HLS) |
| **Give** | `give/` | Dons / offrandes, **wallet « Amen coins »**, mobile money (M-Pesa, Airtel, Orange, Afrimoney), carte, reçus, historique |
| **Community** | `community/` | Groupes & chat, mur de prière, événements (RSVP) |
| **Profile** | `profile/` | Profil, prise de **rendez-vous pastoraux**, notifications, réglages |
| **Onboarding** | `onboarding/` | Auth téléphone → **OTP** → JWT (access + refresh persistés via `expo-secure-store`) |

Le **dashboard admin** (rôles `pastor`/`admin`) couvre actuellement : **Vue d'ensemble** (KPIs), **Soin pastoral** (file de prières + rendez-vous), **Dons** (synthèse financière), **Contenus** (planification & passage en direct), **Membres** (People) et **Activité**. Voir [§ Connexion dashboard](#-connexion-dashboard) pour la cartographie page↔endpoint et la feuille de route.

> **État actuel** : le **backend est en ligne**, le **mobile** et le **dashboard** consomment l'API réelle. Les mocks mobiles (`src/data/`) restent disponibles comme fallback de dev via `EXPO_PUBLIC_USE_MOCKS`.

---

## 🧱 Structure du dépôt

```
IPCK-APP/
├── README.md                # Ce fichier
├── APP.md                   # Architecture technique des frontends
├── BACKEND_PLAN.md          # Plan backend (10 phases, référence)
├── DEPLOY.md                # Déploiement Railway / Vercel / EAS
├── CHANGELOG.md
├── docker-compose.yml       # Postgres 16 + Redis 7 (dev local)
├── Dockerfile               # Image runtime backend (build Railway)
├── railway.json             # Config service Railway (racine)
├── backend/                 # API NestJS 11 + Prisma 6 (17 modules)
│   ├── src/                 # auth, users, devotionals, sermons, content, groups,
│   │                        # prayers, events, giving, appointments, notifications,
│   │                        # activity, admin, reference, health, prisma, redis, config
│   ├── prisma/              # schema.prisma + migrations + seed.ts
│   └── README.md
├── IPCKAdmin/               # Dashboard admin (Vite + React + TS + Carbon) → Vercel
│   └── src/{api,auth,components,pages}/
├── IPCKConnectMobile/       # App mobile (Expo / RN / TS) → EAS
│   └── src/{api,auth,components,data,navigation,screens,theme}/
├── IPCKHouse-Dashboard/     # Prototype CDN initial — conservé comme référence visuelle
└── docs/                    # Spec API, OpenAPI, matrices, plans de test
```

---

## ✅ Prérequis

| Outil | Version conseillée | Pour |
| --- | --- | --- |
| **Node.js** | **20.x LTS** | Tous les sous-projets |
| **pnpm** | ≥ 11 | Backend & dashboard |
| **npm** | ≥ 10 | App mobile |
| **Expo CLI / EAS CLI** | dernière | Dev & build mobile |
| Compte **Expo (EAS)** | — | Builds cloud AAB/IPA |
| **Docker** + Docker Compose | dernière | Postgres + Redis en local |
| Compte **Railway** | — | Hébergement backend (Postgres + Redis managés) |
| Compte **Vercel** | — | Hébergement dashboard |

---

## 🚀 Installation & démarrage local

### 1. Backend (API)

```bash
# Depuis la racine : Postgres + Redis
docker compose up -d

cd backend
cp .env.example .env
pnpm install
pnpm prisma:generate
pnpm prisma:migrate        # crée la base + applique les migrations
pnpm seed                  # (optionnel) jeu de données de démo
pnpm dev                   # API sur http://localhost:3000

# Vérification
curl http://localhost:3000/health     # { "status": "ok", "db": "up", "redis": "up" }
# Swagger : http://localhost:3000/docs
```

> ⚠️ Quirk Windows : si le port 3000 est déjà pris (Supabase local), exposer le backend
> sur un autre port via `PORT` dans `.env`.

### 2. Dashboard admin

```bash
cd IPCKAdmin
pnpm install
# Pointe l'API : par défaut le code retombe sur l'API Railway live si VITE_API_URL est absent.
echo "VITE_API_URL=http://localhost:3000/api/v1" > .env.local
pnpm dev                   # http://localhost:5173
```

### 3. App mobile

```bash
cd IPCKConnectMobile
npm install
# .env : EXPO_PUBLIC_API_URL=http://<ip-locale>:3000/api/v1  · EXPO_PUBLIC_USE_MOCKS=false
npm run start              # serveur de dev Expo
```

---

## 📜 Scripts disponibles

**Backend** (`backend/package.json`, pnpm) :

| Script | Description |
| --- | --- |
| `pnpm dev` | NestJS en watch |
| `pnpm build` / `pnpm start` | Build prod / run `dist/main.js` |
| `pnpm lint` / `pnpm format` | ESLint / Prettier |
| `pnpm test` / `pnpm test:cov` / `pnpm test:e2e` | Tests unitaires / couverture / e2e (Supertest) |
| `pnpm prisma:migrate` / `pnpm prisma:deploy` / `pnpm prisma:reset` | Migrations dev / prod / reset |
| `pnpm seed` | Seed de démo |
| `pnpm openapi:dump` | Génère `docs/openapi.generated.json` |
| `pnpm fetch:videos` | Télécharge les MP4 dans `backend/media/videos/` |

**Dashboard** (`IPCKAdmin/package.json`, pnpm) :

| Script | Description |
| --- | --- |
| `pnpm dev` | Serveur Vite |
| `pnpm build` | `tsc -b && vite build` (sortie `dist/`) |
| `pnpm preview` | Prévisualise le build |
| `pnpm lint` | `tsc --noEmit` |

**Mobile** (`IPCKConnectMobile/package.json`, npm) :

| Script | Description |
| --- | --- |
| `npm run start` | Serveur de dev Expo |
| `npm run android` / `npm run ios` / `npm run web` | Cibles Android / iOS / web |

---

## 🔑 Variables d'environnement

| Variable | Cible | Usage |
| --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | Mobile | URL de base de l'API (`…/api/v1`) |
| `EXPO_PUBLIC_USE_MOCKS` | Mobile | Bascule mock ↔ API réelle |
| `VITE_API_URL` | Dashboard | URL de base de l'API (`…/api/v1`) ; fallback codé sur l'API Railway live |
| `DATABASE_URL`, `REDIS_URL` | Backend | Injectés par les plugins Railway (ne pas redéfinir à la main) |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Backend | Secrets JWT (access + refresh) |
| `JWT_ACCESS_TTL`, `JWT_REFRESH_TTL` | Backend | Durées de vie des tokens |
| `CORS_ORIGINS` | Backend | Domaines autorisés (⚠️ doit inclure l'URL Vercel du dashboard) |
| `PAYMENT_PROVIDER`, `PAYMENT_WEBHOOK_SECRET` | Backend | `mock` / `flexpay` / `stripe` + signature webhook |
| `SMS_PROVIDER`, `TWILIO_*` | Backend | `console` (dev) / `twilio` |
| `DEV_MASTER_OTP` | Backend | OTP maître **dev uniquement** (`000000` en test ; **vide en prod**) |
| `LOG_LEVEL` | Backend | Niveau de logs pino |

> ⚠️ Les **secrets** ne vivent que côté backend (variables chiffrées du PaaS), jamais dans le bundle mobile ni le dépôt.

---

## 🔗 Connexion dashboard

Le dashboard (`IPCKAdmin/`) s'authentifie en **OTP staff** (téléphone → JWT access + refresh),
réservé aux rôles `pastor`/`admin`, et consomme l'API via `src/api/client.ts` (axios +
interceptors avec **refresh single-flight** sur 401).

| Page dashboard | Endpoint(s) backend | Statut |
| --- | --- | --- |
| **Overview** | `GET /admin/overview` | ✅ branché |
| **Care** | `GET /prayers/queue`, `GET /appointments`, `PATCH /prayers/:id/status`, `POST /prayers/:id/respond` | ✅ branché |
| **Giving** | `GET /giving/admin/summary` | ✅ branché |
| **Content** | `GET /content/admin`, `POST/PATCH/DELETE /content/:id` | ✅ branché |
| **People** | `GET /users`, `GET /users/new` | ✅ branché |
| **Activity** | `GET /admin/activity` | ✅ branché |

> Analyse détaillée des **points critiques** de la connexion (session/refresh, CORS, RBAC, couverture)
> et feuille de route : [`docs/dashboard-connection-analysis.md`](./docs/dashboard-connection-analysis.md).

---

## 📦 Déploiement

Voir [`DEPLOY.md`](./DEPLOY.md) pour la procédure complète.

- **Backend** → **Railway** : Docker + `railway.json`, healthcheck `/health`, `prisma migrate deploy` au démarrage, plugins Postgres + Redis. URL publique → `…/api/v1`.
- **Dashboard** → **Vercel** : Root Directory `IPCKAdmin`, framework Vite, `VITE_API_URL` pointant sur l'API. Redéploiement auto à chaque push `main`.
- **Mobile** → **Expo EAS** : profils `preview`/`production`, `eas build` (modules natifs comme `expo-video` → build EAS requis, pas Expo Go).

> Repo prod : `https://github.com/dav24300/IPCK-APP` (branche `main`). Railway suit `bisingwaj/ipck@main`.

---

## 🤝 Contribution

- **Branches** : `main` (prod). Branches de fonctionnalité pour le reste.
- **Commits** : convention [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`, `chore:`…).
- **Code** : TypeScript strict ; backend modulaire NestJS (DTO + `class-validator`, RBAC par rôle) ; dashboard sur IBM Carbon ; mobile sur `src/theme` (tokens) + composants `src/components`.
- **Tests** : backend (Jest unit + Supertest e2e), mobile (Maestro, `.maestro/`).
- **Règle d'or** : préserver le comportement des frontends existants lors des évolutions backend.

---

## 📄 Licence & contact

- Licence : `UNLICENSED` (propriétaire / interne IPCK).
- Contact : équipe technique IPCK.

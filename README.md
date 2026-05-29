# IPCK — Plateforme d'engagement de l'International Protestant Church of Kinshasa

Plateforme numérique de l'**IPCK** composée de deux frontends et d'un backend à construire :

- **IPCK Connect** — application mobile membres (Expo / React Native / TypeScript).
- **IPCK House** — dashboard admin web (React + IBM Carbon Design System).
- **Backend** — API NestJS + PostgreSQL **à construire** (voir [`BACKEND_PLAN.md`](./BACKEND_PLAN.md)).

> 📄 Documentation associée :
> - [`APP.md`](./APP.md) — architecture technique détaillée des frontends + instructions de build.
> - [`BACKEND_PLAN.md`](./BACKEND_PLAN.md) — plan de construction du backend & de mise en production, en 10 phases.

---

## ✨ Fonctionnalités

L'app mobile couvre 6 domaines :

| Domaine | Contenu |
| --- | --- |
| **Today** | Dévotion quotidienne (verset, méditation, prière, application), streak, historique |
| **Watch** | Bibliothèque de sermons + culte en **direct** |
| **Give** | Dons / offrandes, **wallet « Amen coins »**, mobile money (M-Pesa, Airtel, Orange, Afrimoney), carte, reçus, historique |
| **Community** | Groupes & chat, mur de prière, événements (RSVP) |
| **Profile** | Profil, prise de **rendez-vous pastoraux**, notifications, réglages |

Le dashboard admin offre : KPIs, monitoring du direct, file de prières, rendez-vous, analytics de dons, planification de contenu.

> État actuel : les deux frontends fonctionnent sur **données mockées**. Aucun backend n'est encore branché.

---

## 🧱 Structure du dépôt

```
IPCK-APP/
├── README.md                # Ce fichier
├── APP.md                   # Architecture technique des frontends
├── BACKEND_PLAN.md          # Plan backend + production (10 phases)
├── IPCKConnectMobile/       # App mobile (Expo / RN / TS)
├── IPCKHouse-Dashboard/     # Dashboard admin (React + Carbon, servi via CDN)
└── backend/                 # API NestJS — À CRÉER (cf. BACKEND_PLAN.md)
```

---

## ✅ Prérequis

| Outil | Version conseillée | Pour |
| --- | --- | --- |
| **Node.js** | **20.x LTS** | Tous les sous-projets |
| **npm** (ou pnpm) | npm ≥ 10 / pnpm ≥ 9 | Gestion des paquets |
| **Expo CLI / EAS CLI** | dernière | Dev & build mobile |
| Compte **Expo (EAS)** | — | Builds cloud AAB/IPA |
| **Android Studio** | dernière | Émulateur / build local Android |
| **Xcode** (macOS) | dernière | Simulateur / build iOS |
| **Docker** + Docker Compose | dernière | Backend local (Postgres, Redis) |
| Compte **Railway** ou **Render** | — | Hébergement backend & dashboard |

---

## 🚀 Installation

```bash
# 1. Récupérer le code et initialiser le versionnage (non encore versionné)
cd IPCK-APP
git init

# 2. App mobile
cd IPCKConnectMobile
npm install
npm run start          # serveur de dev Expo

# 3. Dashboard admin (prototype actuel servi en statique)
cd ../IPCKHouse-Dashboard
npx serve .            # ou : python -m http.server
```

Le backend (`backend/`) n'existe pas encore : sa mise en place est décrite dans [`BACKEND_PLAN.md`](./BACKEND_PLAN.md) (Phase 2).

---

## 📜 Scripts disponibles

**Mobile** (`IPCKConnectMobile/package.json`) :

| Script | Commande | Description |
| --- | --- | --- |
| `start` | `npm run start` | Démarre le serveur de dev Expo |
| `android` | `npm run android` | Ouvre sur Android |
| `ios` | `npm run ios` | Ouvre sur iOS (macOS) |
| `web` | `npm run web` | Lance la cible web Metro |

**Dashboard** : pas de build actuel — servi en statique (`npx serve .`). La migration vers Vite (avec scripts `dev`/`build`/`preview`) est prévue en Phase 5.

---

## 🔑 Variables d'environnement

| Variable | Cible | Usage |
| --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | Mobile | URL de base de l'API |
| `EXPO_PUBLIC_USE_MOCKS` | Mobile | Bascule mock ↔ API réelle |
| `VITE_API_URL` | Dashboard (futur) | URL de base de l'API |
| `DATABASE_URL`, `REDIS_URL`, `JWT_*`, clés providers (SMS, paiement, push) | Backend | Voir `.env.example` à créer en Phase 2 |

> ⚠️ Les **secrets** ne vivent que côté backend (variables chiffrées du PaaS), jamais dans le bundle mobile ni le dépôt.

---

## 📦 Déploiement

- **Mobile** : builds via **EAS** (profils `preview`/`production`, génération **AAB**/**IPA**) — voir [`APP.md`](./APP.md) §7.
- **Backend** : déployé sur **Railway / Render** (Postgres + Redis managés, HTTPS auto) — voir [`BACKEND_PLAN.md`](./BACKEND_PLAN.md) Phases 6 & 10.
- **Dashboard** : build statique (Vite) déployé sur Render Static / Vercel — voir Phase 5.

---

## 🤝 Contribution

- **Versionnage** : `git init` puis branches `main` (prod) / `develop` (staging) + branches de fonctionnalité.
- **Commits** : convention [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `docs:`…).
- **Code** : TypeScript strict, respect du design system (`src/theme`), réutilisation des composants de `src/components`.
- **Tests** : pas encore en place ; à introduire avec le backend (cf. Phases 3 et 7).
- **Règle d'or actuelle** : le code des frontends existants ne doit pas être cassé lors de l'intégration du backend (voir Phase 4 pour la marche à suivre non destructive).

---

## 📄 Licence & contact

- Licence : à définir (propriétaire / interne IPCK par défaut).
- Contact : équipe technique IPCK.
```

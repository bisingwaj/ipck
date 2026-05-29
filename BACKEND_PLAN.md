# BACKEND_PLAN.md — Construction du backend & mise en production IPCK

> **Objet** : guide d'exécution **phase par phase** pour doter la plateforme IPCK d'un backend de production
> et déployer l'app mobile (Android + iOS) et le dashboard jusqu'à une **démo fonctionnelle et présentable**.
>
> **Périmètre** : ce document est un **plan d'exécution**, pas une livraison de code. Il décrit *quoi* coder
> (fichiers, routes, services, scripts) sans fournir le code complet. Seuls de très courts extraits de
> configuration apparaissent à titre d'exemple.
>
> **Contrainte** : le code des frontends existants (`IPCKConnectMobile/`, `IPCKHouse-Dashboard/`) **ne doit pas
> être modifié** sans suivre les instructions non destructives de la Phase 4.
>
> Voir aussi : [`APP.md`](./APP.md) (architecture frontend) et [`README.md`](./README.md).

---

## Choix d'infrastructure (et justifications)

| Brique | Choix | Pourquoi |
| --- | --- | --- |
| **Framework API** | **NestJS** (TypeScript) | Cohérent avec le front TS, architecture modulaire, DI, validation (`class-validator`), génération OpenAPI ; activement maintenu. |
| **Base de données** | **PostgreSQL 16** + **Prisma** | Relationnel adapté aux dons / comptabilité / wallet ; migrations typées ; Prisma maintenu activement. |
| **Cache / files** | **Redis 7** + **BullMQ** | Cache, rate-limiting, files asynchrones (SMS, push, webhooks paiement). |
| **Auth** | Téléphone + **OTP** → **JWT** access/refresh | Reprend le flux déjà présent dans l'UI ; token stocké côté mobile via `expo-secure-store`. |
| **SMS / OTP** | Agrégateur derrière une interface abstraite | Twilio Verify ou fournisseur local RDC, interchangeable. |
| **Mobile money RDC** | Abstraction `PaymentProvider` | Agrégateur type **FlexPay / MaxiCash** (M-Pesa, Airtel, Orange, Afrimoney) + carte via **Stripe** ; webhooks signés ; aucun secret en clair. |
| **Push** | **Expo Push Notifications** | FCM/APNs gérés par Expo, cohérent avec la stack mobile. |
| **Temps réel** | **WebSocket** (`@nestjs/websockets`) + adaptateur Redis | Chat de groupe, « amens » en direct, présence. |
| **Stockage fichiers** | S3-compatible (**Cloudflare R2** / Supabase Storage) | Avatars, vignettes de sermons, médias de chat. |
| **Hébergement** | **Railway / Render** | PaaS managé : déploiement par push Git, Postgres + Redis inclus, HTTPS auto, idéal pour la démo. |
| **CI/CD** | **GitHub Actions** + **EAS** | Lint/test/build/déploiement backend & dashboard ; builds mobiles AAB/IPA via EAS. |
| **Observabilité** | **pino** (logs) + **Sentry** (erreurs) | Logs structurés et suivi d'erreurs backend + mobile. |

**Versions cibles** : Node 20 LTS · NestJS 10/11 · Prisma 5/6 · PostgreSQL 16 · Redis 7 · (mobile : Expo SDK 52, React Navigation v7).

**Dépendances frontales à ajouter (mobile, Phase 4)** : `@tanstack/react-query`, `expo-secure-store`, `expo-notifications`, un client HTTP (`axios` ou `fetch` natif). Toutes activement maintenues et compatibles Expo SDK 52.

---

## Vue d'ensemble des phases

| Phase | Nom | Sortie vérifiable |
| --- | --- | --- |
| 1 | Analyse & spécification | Spec d'API validée, matrice écran↔endpoint complète |
| 2 | Environnement de dev | `docker compose up` + `/health` vert |
| 3 | Modélisation & API | Endpoints + auth OTP testés, OpenAPI sur `/docs` |
| 4 | Intégration mobile | App sur données réelles, parcours clés OK |
| 5 | Dashboard | Dashboard buildé & déployé sur l'API |
| 6 | CI/CD | Pipelines verts, builds EAS générés |
| 7 | Tests E2E | Scénarios critiques OK Android + iOS + dashboard |
| 8 | Sécurité & ops | Audit propre, backup restauré, alerting actif |
| 9 | Démo | Seed reproductible, scénario déroulé |
| 10 | Production | Services prod verts, démo finale validée |

---

## Phase 1 : Analyse de l'existant & spécification du backend

- **Objectif** : figer le contrat d'API à partir des écrans et des entités mockées avant d'écrire la moindre ligne de backend.
- **Analyse** :
  - Lire chaque écran consommateur de [`IPCKConnectMobile/src/data/mock.ts`](./IPCKConnectMobile/src/data/mock.ts) et recenser toutes les structures et leurs champs.
  - Cartographier **écran → endpoint(s)** nécessaires (lecture/écriture/action).
  - Recenser les besoins transverses : temps réel (chat, amens live), paiement (mobile money + carte), SMS/OTP, push, upload de fichiers.
  - Faire de même pour les panneaux du dashboard ([`IPCKHouse-Dashboard/src/data.jsx`](./IPCKHouse-Dashboard/src/data.jsx)).
  - Définir les **rôles** : `member`, `group_leader`, `pastor`, `admin`.
- **Code / Configuration à produire** (documents, pas de code applicatif) :
  - `docs/api-spec.md` : entités, relations, liste des endpoints REST (verbe + chemin + payload + réponse), rôles autorisés par endpoint, **enveloppe standard** de pagination (`{ data, page, pageSize, total }`) et d'erreur (`{ statusCode, code, message }`).
  - Squelette **OpenAPI** initial (`docs/openapi.yaml`).
  - **Matrice écran↔endpoint** (tableau) couvrant mobile + dashboard.
- **Tests à réaliser** : revue croisée de la matrice — vérifier qu'aucun écran n'est sans source de données et qu'aucun endpoint n'est orphelin.
- **Critères de succès** : 100 % des écrans mobile et panneaux dashboard couverts par ≥ 1 endpoint ; spec relue et validée par l'équipe.
- **Dépendances** : accès au code (acquis).

---

## Phase 2 : Environnement de développement backend

- **Objectif** : un socle reproductible (DB, cache, projet NestJS) qui démarre en une commande.
- **Analyse** : choisir le gestionnaire de paquets (**pnpm** recommandé) ; fixer Node 20 LTS, Postgres 16, Redis 7 ; définir la structure de `backend/`.
- **Code / Configuration à produire** :
  - `git init` à la racine + `.gitignore` adaptés (node_modules, `.env`, build, artefacts EAS).
  - **Scaffolding NestJS** dans `backend/` (`nest new`), structure par modules.
  - `docker-compose.yml` (services `postgres`, `redis`) pour le dev local.
  - `.env.example` documentant toutes les variables (`DATABASE_URL`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, clés providers…).
  - Configuration **Prisma** (`prisma/schema.prisma` minimal + connexion) et client généré.
  - Scripts npm/pnpm : `dev`, `build`, `start`, `prisma:migrate`, `prisma:generate`, `seed`, `lint`, `test`.
  - **ESLint + Prettier** ; module de **config typée** (`@nestjs/config` + validation Zod/Joi au démarrage).
  - Endpoint `GET /health` (vérifie connectivité DB + Redis).

    *Exemple court de service compose (extrait) :*
    ```yaml
    services:
      postgres:
        image: postgres:16
        environment: { POSTGRES_PASSWORD: postgres }
        ports: ["5432:5432"]
      redis:
        image: redis:7
        ports: ["6379:6379"]
    ```
- **Tests à réaliser** : `docker compose up` démarre Postgres + Redis ; `pnpm dev` lance NestJS ; `GET /health` renvoie 200.
- **Critères de succès** : un nouveau développeur démarre le backend de zéro via compose + une commande ; `/health` vert.
- **Dépendances** : Phase 1 terminée ; Docker installé.

---

## Phase 3 : Modélisation des données & API (auth, CRUD, rôles)

- **Objectif** : API REST fonctionnelle couvrant toutes les entités et l'authentification.
- **Analyse** : valider le schéma relationnel issu de la Phase 1 :
  - `User` ↔ `Group` (n-n via `GroupMembership`) ↔ `GroupMessage`.
  - `Donation` ↔ `Fund` ↔ `PaymentMethod` ; `AmenWallet` ↔ `AmenTransaction`.
  - `Prayer` ↔ `PrayerAmen` ; `ChurchEvent` ↔ `EventRsvp`.
  - `Devotional`, `Sermon`, `Appointment`, `Notification`, `ActivityLog`.
  - Définir la politique d'accès (RBAC) par rôle.
- **Code / Configuration à produire** :
  - `schema.prisma` complet + **migrations** versionnées.
  - **Modules NestJS par domaine** : `auth`, `users`, `devotionals`, `sermons`, `groups`, `prayers`, `events`, `giving` (dons + wallet), `appointments`, `notifications`, `activity`.
  - **DTO + validation** (`class-validator`) sur chaque entrée.
  - **Guards** JWT + **RBAC** (décorateur de rôles).
  - **Flux OTP** : génération du code, envoi via l'**interface SMS abstraite**, vérification, émission JWT access/refresh + **rotation/refresh**.
  - Endpoints **CRUD** + endpoints **d'action** : RSVP événement, « prayed » (amen), top-up wallet, création de don, etc.
  - **Pagination / filtre / tri** standardisés.
  - **OpenAPI** exposé sur `/docs` (Swagger NestJS).
- **Tests à réaliser** :
  - **Unitaires** : services critiques (logique wallet/dons, génération/vérif OTP).
  - **Intégration e2e** (Supertest) : auth complète + parcours clés, sur **base de test isolée**.
  - Provider SMS/paiement **mocké** en test.
- **Critères de succès** : tous les endpoints de la spec implémentés et testés ; OTP fonctionnel de bout en bout (provider mocké) ; couverture des services métier critiques ≥ ~80 %.
- **Dépendances** : Phase 2 terminée.

---

## Phase 4 : Intégration de l'API dans l'app mobile

- **Objectif** : remplacer les données mockées par l'API réelle **sans casser l'UI existante**.
- **Analyse** : repérer chaque import de `mock.ts` ; identifier les écrans dont l'état local doit devenir de l'état serveur (listes, détails, wallet, chat).
- **Instructions à suivre par l'équipe** (modifications **du code mobile**, réalisées par l'équipe — *pas* dans le cadre de cette tâche documentaire) :
  - Ajouter `src/api/client.ts` : instance HTTP avec base URL `EXPO_PUBLIC_API_URL` + injection automatique du token + refresh.
  - Ajouter **TanStack Query** (cache/refetch/optimistic) et un `src/auth/AuthContext.tsx` ; persister le token via **`expo-secure-store`**.
  - Créer des hooks `src/api/hooks/` (un par domaine) **renvoyant la même forme de données que `mock.ts`**, afin de minimiser les changements dans les écrans (idéalement : remplacer un import de mock par un appel de hook).
  - Conserver `mock.ts` comme **fixtures de dev / fallback**, piloté par `EXPO_PUBLIC_USE_MOCKS`.
  - Brancher le **flux OTP réel** dans `PhoneScreen` / `OTPScreen` ; ajouter un **garde d'authentification** dans `RootNavigator` (rendu conditionnel onboarding ↔ `Main`).
  - Enregistrer le **token de push Expo** après `NotifPermissionScreen` et l'envoyer au backend.
- **Code / Configuration à produire (côté dépôt, documentaire)** :
  - `docs/mobile-integration.md` : tableau écran→hook→endpoint, et marche à suivre non destructive.
  - Collection **Postman/Insomnia** partagée.
- **Tests à réaliser** : lancer l'app contre le backend local ; vérifier login OTP, chargement dévotion/sermons/groupes, **un don de bout en bout** (provider sandbox), réception d'un **push de test**.
- **Critères de succès** : l'app fonctionne sur données réelles ; parcours onboarding → don → communauté OK ; token **persistant** entre redémarrages.
- **Dépendances** : Phase 3 terminée.

---

## Phase 5 : Construction & déploiement du dashboard

- **Objectif** : dashboard admin maintenable et déployé, branché au backend.
- **Analyse** : l'actuel `IPCKHouse-Dashboard/` (CDN + Babel in-browser) n'est pas adapté à la production. Décision retenue : **migrer vers un build Vite + React + TypeScript + Carbon** dans un **nouveau dossier** (`IPCKAdmin/`), en réutilisant les panneaux JSX existants comme **référence visuelle** (sans modifier l'existant).
- **Code / Configuration à produire** :
  - Projet **Vite + React + TS** (`IPCKAdmin/`) avec IBM Carbon.
  - Portage des panneaux **Overview, Care, Giving, People, Content, Activity** en composants consommant l'API (rôles `pastor`/`admin`).
  - **Auth staff** (login email/mot de passe ou OTP staff) + stockage de session sécurisé.
  - Fonctions admin : gestion de la **file de prières** (approuver/répondre), **rendez-vous**, **planification de contenu**, **exports financiers**.
  - Variable `VITE_API_URL` ; scripts `dev`/`build`/`preview`.
- **Tests à réaliser** : `vite build` sans erreur ; chaque panneau affiche des **données réelles** ; actions admin (approuver une prière, planifier un contenu) **persistées** côté API.
- **Critères de succès** : dashboard buildé et déployé (Render Static / Vercel) consommant l'API ; auth staff fonctionnelle.
- **Dépendances** : Phase 3 (API). Phase 4 utile mais non bloquante.

---

## Phase 6 : CI/CD (mobile, backend, dashboard)

- **Objectif** : automatiser build/test/déploiement des trois cibles.
- **Analyse** : **GitHub Actions** ; modèle de branches `main` (prod) / `develop` (staging) ; secrets (tokens Railway/Render, Expo, providers) **en secrets CI** uniquement.
- **Code / Configuration à produire** :
  - **Workflow backend** : `lint` + `test` + `build` → déploiement **Railway/Render** sur push `main` ; **migrations Prisma** jouées au déploiement.
  - **Workflow dashboard** : `vite build` → déploiement statique.
  - **EAS mobile** : `eas.json` avec profils `development` / `preview` / `production` ; builds **AAB** (Android) & **IPA** (iOS) ; soumission stores **optionnelle** (`eas submit`).
  - **Cache** des dépendances (pnpm/npm) dans les workflows.
- **Tests à réaliser** : un push déclenche le pipeline ; déploiement **staging** vérifiable ; build **EAS preview** installable (APK + TestFlight).
- **Critères de succès** : pipelines verts de bout en bout ; déploiement backend/dashboard automatique ; artefacts mobiles générés par EAS.
- **Dépendances** : Phases 3 & 5 ; comptes Railway/Render, Expo et stores configurés (sans secrets réels dans le dépôt).

---

## Phase 7 : Tests de bout en bout & corrections

- **Objectif** : valider les parcours complets sur Android, iOS et dashboard.
- **Analyse** : définir les **scénarios critiques** : onboarding OTP, dévotion, lecture/live sermon, don mobile money + wallet, chat de groupe, mur de prière, RSVP événement, prise de rendez-vous, push ; + parcours admin (prière, rendez-vous, contenu).
- **Code / Configuration à produire** :
  - **Plan de test e2e** (`docs/e2e-plan.md`).
  - Tests **API** (Supertest, déjà initiés en Phase 3) consolidés.
  - Tests **UI mobile** automatisés avec **Maestro** (flows critiques).
  - **Check-list de tests manuels** iOS/Android (sur build EAS preview).
  - **Journal de bugs** (issues) + corrections.
- **Tests à réaliser** : exécuter la suite Maestro + la check-list manuelle sur émulateur/appareil **iOS et Android** + le dashboard.
- **Critères de succès** : tous les scénarios critiques passent sur les deux OS et le dashboard ; bugs **bloquants** corrigés.
- **Dépendances** : Phases 4, 5, 6 terminées.

---

## Phase 8 : Sécurisation, monitoring, logs, backup

- **Objectif** : rendre la plateforme sûre et observable.
- **Analyse** : revue des surfaces d'attaque (auth, paiements, **PII** des membres, webhooks) ; conformité minimale (chiffrement des secrets, principes RGPD pour les données personnelles).
- **Code / Configuration à produire** :
  - **HTTPS** partout (fourni par le PaaS).
  - **Rate-limiting** (Redis) + **Helmet** + **CORS** stricts.
  - **Validation/sanitisation** systématique des entrées.
  - **Vérification de signature** des webhooks paiement.
  - **Rotation JWT** + **révocation** (liste de refresh tokens).
  - **Logs structurés** (`pino`).
  - **Monitoring d'erreurs** (Sentry backend + mobile) + **uptime check** sur `/health`.
  - **Sauvegardes Postgres automatiques** (snapshots PaaS + dump planifié) + **procédure de restauration testée**.
  - Secrets via **variables d'environnement chiffrées** du PaaS (jamais dans le dépôt).
- **Tests à réaliser** : `npm audit` / **Dependabot** ; **test de restauration** d'un backup sur instance vierge ; vérification du rate-limit ; **rejet d'un webhook non signé** ; déclenchement volontaire d'une alerte Sentry.
- **Critères de succès** : aucune vulnérabilité critique ouverte ; restauration de backup réussie ; alerting opérationnel.
- **Dépendances** : Phases 3 & 6.

---

## Phase 9 : Préparation de la démo

- **Objectif** : disposer d'un environnement de démo crédible et reproductible.
- **Analyse** : définir le **scénario de démonstration** (parcours membre sur mobile + vue dashboard en parallèle) et les données nécessaires.
- **Code / Configuration à produire** :
  - Script de **seed** réaliste : membres, dévotion du jour, sermons, groupes avec messages, prières, événements, dons/wallet, rendez-vous.
  - **Séparation des environnements** (staging/démo vs prod) via variables.
  - **Comptes de démo** : `member`, `group_leader`, `pastor`/`admin`.
  - `docs/DEMO.md` : scénario pas-à-pas, identifiants de démo, providers en **mode sandbox**.
  - Jeux de données **réinitialisables** (script de reset).
- **Tests à réaliser** : exécuter le seed sur un environnement vierge ; **dérouler intégralement** le scénario de démo (mobile + dashboard).
- **Critères de succès** : démo reproductible via **une commande de seed** ; scénario déroulé sans accroc.
- **Dépendances** : Phases 4, 5, 7 terminées.

---

## Phase 10 : Déploiement production final & vérification

- **Objectif** : mise en production et validation finale de la démo.
- **Analyse** : **check-list go-live** — variables prod, providers en mode réel ou sandbox documenté, domaines/DNS, certificats stores.
- **Code / Configuration à produire** :
  - Déploiement **backend + dashboard** en **production** (Railway/Render).
  - Build mobile **production** EAS : **AAB** (Play) + **IPA** (TestFlight / App Store).
  - Configuration des **domaines** + HTTPS.
  - **Smoke tests** post-déploiement.
  - **Tag de release** + notes de version.
- **Tests à réaliser** : smoke tests prod (`/health`, login, un parcours clé) ; installation du **build mobile prod** sur appareil ; vérification du dashboard prod.
- **Critères de succès** : tous les services prod **verts** ; app installable et fonctionnelle ; dashboard accessible ; **démo finale validée** par les parties prenantes.
- **Dépendances** : **toutes** les phases précédentes.

---

## Checklist de progression

- [ ] Phase 1 — Spec & matrice validées
- [ ] Phase 2 — `/health` vert en local
- [ ] Phase 3 — API + auth OTP testées, `/docs` en ligne
- [ ] Phase 4 — App mobile sur données réelles
- [ ] Phase 5 — Dashboard déployé sur l'API
- [ ] Phase 6 — CI/CD verte, builds EAS générés
- [ ] Phase 7 — E2E OK Android + iOS + dashboard
- [ ] Phase 8 — Sécurité/monitoring/backup en place
- [ ] Phase 9 — Seed & scénario de démo prêts
- [ ] Phase 10 — Production en ligne, démo validée
```

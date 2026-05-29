# docs/api-spec.md — Contrat d'API IPCK (Phase 1)

> **Statut** : spec figée à partir des écrans mobiles (`IPCKConnectMobile/src/data/mock.ts` + structures inline des écrans) et des panneaux du dashboard (`IPCKHouse-Dashboard/src/data.jsx`).
> Sert de contrat pour la Phase 3 (implémentation NestJS + Prisma).
>
> **Base URL** : `${API_URL}/api/v1`
> **Format** : JSON (UTF-8). Auth par `Authorization: Bearer <accessToken>`.
> **Versions** : Node 20+, NestJS 11, Prisma 6, PostgreSQL 16, Redis 7.

---

## 1. Conventions transverses

### 1.1 Enveloppe de pagination (listes)

```json
{ "data": [ /* items */ ], "page": 1, "pageSize": 20, "total": 137 }
```

Query params standard sur toute liste : `?page=1&pageSize=20&sort=createdAt:desc&q=<recherche>` (+ filtres spécifiques par endpoint, ex. `?fund=general`).

### 1.2 Enveloppe d'erreur

```json
{ "statusCode": 400, "code": "VALIDATION_ERROR", "message": "phone must be a valid E.164 number" }
```

Codes applicatifs : `VALIDATION_ERROR`, `UNAUTHENTICATED`, `INVALID_OTP`, `OTP_EXPIRED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `PAYMENT_FAILED`, `INSUFFICIENT_BALANCE`, `INTERNAL`.

### 1.3 Rôles (RBAC)

| Rôle | Description |
| --- | --- |
| `member` | Membre standard (app mobile). |
| `group_leader` | Membre + modération de ses groupes. |
| `pastor` | Accès dashboard : care (prières, rendez-vous), contenu, dons. |
| `admin` | Tous droits, y compris people/activity et exports financiers. |

Notation dans la spec : `[member]` = authentifié rôle ≥ member ; `[pastor+]` = pastor ou admin ; `[public]` = sans auth.

### 1.4 Réponses standard

- `200 OK` lecture / action réussie · `201 Created` création · `204 No Content` suppression.
- `400` validation · `401` non authentifié · `403` rôle insuffisant · `404` introuvable · `409` conflit · `429` rate-limit · `5xx` erreur serveur.

---

## 2. Entités & relations

```
User 1───n GroupMembership n───1 Group 1───n GroupMessage
User 1───n Prayer 1───n PrayerAmen n───1 User
User 1───n EventRsvp n───1 ChurchEvent
User 1───n Donation n───1 Fund
User 1───1 AmenWallet 1───n AmenTransaction (─?─ Fund / PaymentMethod)
User 1───n Appointment n───1 AppointmentTopic
User 1───n DevotionalRead n───1 Devotional
User 1───n Notification
User 1───n PushToken
Sermon (standalone, ─?─ LiveSession)
ActivityLog (dérivé, lecture admin)
Fund, PaymentMethod, ServiceTime, AppointmentTopic = données de référence
```

### 2.1 Champs par entité (issus des mocks)

- **User** : `id`, `phone` (E.164, unique), `firstName`, `lastName`, `avatarUrl?`, `role` (`member|group_leader|pastor|admin`), `interests: string[]`, `streakCount`, `createdAt`, `updatedAt`. (Onboarding : `ProfileSetup`, `Interests`.)
- **Devotional** : `id`, `date`, `title`, `verseRef`, `verseText`, `body`, `prayer`, `applyTitle`, `applySteps: string[]`, `publishAt`, `status` (`draft|scheduled|published`).
- **DevotionalRead** : `id`, `userId`, `devotionalId`, `readAt`. (Pilote `read` de `PastDevotionals` + `streakCount`.)
- **Sermon** : `id`, `title`, `speaker`, `date`, `duration`, `series`, `live: boolean`, `videoUrl?`, `thumbnailUrl?`, `status`.
- **Group** : `id`, `name`, `leader` (→ userId), `meets`, `color`, `membersCount` (dérivé), `description?`.
- **GroupMembership** : `id`, `userId`, `groupId`, `role` (`member|leader`), `lastReadAt`, `joinedAt`. `unread` = dérivé (messages après `lastReadAt`).
- **GroupMessage** : `id`, `groupId`, `authorId`, `text`, `createdAt`. (`mine` dérivé côté API selon le requêteur.)
- **Prayer** : `id`, `authorId`, `visibility` (`public|anon|private`), `text`, `amenCount` (dérivé), `status` (`pending|approved|answered|rejected`), `createdAt`. `who`/`initials`/`color` dérivés (masqués si `anon`/`private`).
- **PrayerAmen** : `id`, `prayerId`, `userId`, `createdAt`. (`iPrayed` dérivé.)
- **ChurchEvent** : `id`, `name`, `startsAt`, `location`, `capacity?`, `rsvpCount` (dérivé), `color`, `description`.
- **EventRsvp** : `id`, `eventId`, `userId`, `status` (`going|cancelled`), `createdAt`.
- **Fund** (réf.) : `id`, `name`, `description`, `accent`, `budget?`, `ytd?` (dérivé). Ex. `general|building|missions|benevolence`.
- **PaymentMethod** (réf.) : `id`, `name`, `kind` (`momo|card`), `logo`, `color`, `instant`. Ex. `airtel|mpesa|orange|afri|card`.
- **Donation** : `id`, `ref` (`GFT-…`), `userId`, `amount` (USD), `fundId`, `method`, `status` (`pending|received|failed`), `anonymous`, `createdAt`. Webhook provider met à jour `status`.
- **AmenWallet** : `id`, `userId` (unique), `balanceCoins`, `pendingTopupCoins`, `defaultFundId`. (1 coin = 1 USD.)
- **AmenTransaction** : `id`, `walletId`, `kind` (`topup|amen|redeem|refund`), `coins` (signé), `service?`, `fundId?`, `method?`, `status` (`completed|pending|failed`), `createdAt`.
- **Appointment** : `id`, `userId`, `topicId`, `pastorId?`, `slotStart`, `location?`, `notes?`, `status` (`tentative|confirmed|cancelled`), `createdAt`. Réf. **AppointmentTopic** : `counseling|prayer|marriage|baptism|general`.
- **Notification** : `id`, `userId`, `group` (`Today|Yesterday|…`), `icon`, `title`, `subtitle`, `sentAt`, `readAt?`, `color`.
- **PushToken** : `id`, `userId`, `expoToken`, `platform`, `createdAt`.
- **ActivityLog** : `id`, `kind`, `actorLabel`, `description`, `createdAt`. (Lecture admin/pastor.)
- **LiveSession** (live + dashboard) : `id`, `sermonId?`, `state` (`offline|live|ended`), `title`, `series`, `speaker`, `startedAt`, `viewersLive`, `viewersPeak`, `inPerson`, `quality`, `sceneActive`, `scenes: string[]`, `geo: {city,n,pct}[]`.
- **ServiceTime** (réf.) : `id`, `time`, `name`, `description`.

---

## 3. Endpoints

### 3.1 Auth & OTP — `/auth`

| Méthode | Chemin | Rôle | Payload → Réponse |
| --- | --- | --- | --- |
| POST | `/auth/otp/request` | `[public]` | `{ phone }` → `{ requestId, expiresIn }`. Génère OTP, envoie via SMS provider (mock en dev). Rate-limité. |
| POST | `/auth/otp/verify` | `[public]` | `{ phone, code }` → `{ accessToken, refreshToken, user, isNewUser }`. |
| POST | `/auth/refresh` | `[public]` | `{ refreshToken }` → `{ accessToken, refreshToken }` (rotation). |
| POST | `/auth/logout` | `[member]` | `{ refreshToken }` → `204`. Révoque le refresh token. |
| GET | `/auth/me` | `[member]` | → `User` courant. |

### 3.2 Users & profil — `/users`

| Méthode | Chemin | Rôle | Description |
| --- | --- | --- | --- |
| PATCH | `/users/me` | `[member]` | MAJ profil (`firstName`, `lastName`, `avatarUrl`). |
| PUT | `/users/me/interests` | `[member]` | `{ interests: string[] }`. |
| GET | `/users/me/streak` | `[member]` | `{ count, days: boolean[] }` (écran Streak). |
| POST | `/users/me/push-tokens` | `[member]` | `{ expoToken, platform }` → enregistre token push. |
| DELETE | `/users/me/push-tokens/:token` | `[member]` | Désenregistre. |
| GET | `/users` | `[pastor+]` | Liste membres (dashboard People) — paginée. |
| GET | `/users/new` | `[pastor+]` | Nouveaux membres (signaux People). |

### 3.3 Devotionals — `/devotionals`

| Méthode | Chemin | Rôle | Description |
| --- | --- | --- | --- |
| GET | `/devotionals/today` | `[member]` | Dévotion du jour (`TodayHome`, `Devotional`). |
| GET | `/devotionals` | `[member]` | Historique paginé (`PastDevotionals`), inclut `read` pour le requêteur. |
| GET | `/devotionals/:id` | `[member]` | Détail. |
| POST | `/devotionals/:id/read` | `[member]` | Marque lu (`Prayed`/streak). → `{ streakCount }`. |
| POST | `/devotionals` | `[pastor+]` | Crée (planification contenu dashboard). |
| PATCH | `/devotionals/:id` | `[pastor+]` | MAJ / planifie (`status`, `publishAt`). |
| DELETE | `/devotionals/:id` | `[pastor+]` | Supprime un brouillon. |

### 3.4 Sermons & live — `/sermons`, `/live`

| Méthode | Chemin | Rôle | Description |
| --- | --- | --- | --- |
| GET | `/sermons` | `[member]` | Liste (`WatchList`), filtre `?series=`, `?live=true`. |
| GET | `/sermons/:id` | `[member]` | Détail (`SermonDetail`). |
| POST | `/sermons` | `[pastor+]` | Crée / planifie. |
| PATCH | `/sermons/:id` | `[pastor+]` | MAJ. |
| GET | `/live/current` | `[member]` | Session live courante (`Live`, dashboard service). |
| POST | `/live/:id/amen` | `[member]` | Envoie un « amen » live `{ coins, fundId? }` → débit wallet + broadcast WS. |
| GET | `/live/:id/amens` | `[member]` | Flux récent d'amens (`liveAmens`). |
| PATCH | `/live/:id` | `[pastor+]` | Contrôle régie (state, sceneActive). |

> **WebSocket** `/ws` (namespace `live`) : events `amen:new`, `viewers:update`, `prayer:amen`, `chat:message`, `presence`.

### 3.5 Groups & chat — `/groups`

| Méthode | Chemin | Rôle | Description |
| --- | --- | --- | --- |
| GET | `/groups` | `[member]` | Tous les groupes (`GroupsList`), `?mine=true` pour `myGroups`. Inclut `membersCount`, `unread`, `lastMessage`. |
| GET | `/groups/:id` | `[member]` | Détail (`GroupDetail`). |
| POST | `/groups/:id/join` | `[member]` | Rejoint. |
| DELETE | `/groups/:id/leave` | `[member]` | Quitte. |
| GET | `/groups/:id/messages` | `[member]` | Messages paginés (`GroupChat`), tri `createdAt:asc`. |
| POST | `/groups/:id/messages` | `[member]` | `{ text }` → message créé + broadcast WS. |
| POST | `/groups/:id/read` | `[member]` | Marque lus (reset `unread`). |
| POST | `/groups` | `[pastor+]` | Crée un groupe. |
| PATCH | `/groups/:id` | `[group_leader+]` | MAJ (leader du groupe ou pastor+). |

### 3.6 Prayers — `/prayers`

| Méthode | Chemin | Rôle | Description |
| --- | --- | --- | --- |
| GET | `/prayers` | `[member]` | Mur public paginé (`PrayerWall`), `public` + `approved`. Inclut `amenCount`, `iPrayed`. |
| GET | `/prayers/:id` | `[member]` | Détail (`PrayerDetail`). |
| POST | `/prayers` | `[member]` | `{ text, visibility }` (`SubmitPrayer`). `private`/`anon` → file de care. |
| POST | `/prayers/:id/amen` | `[member]` | Toggle « prayed » → `{ amenCount, iPrayed }` + WS. |
| GET | `/prayers/queue` | `[pastor+]` | File de care (`pending`) — dashboard Care. |
| PATCH | `/prayers/:id/status` | `[pastor+]` | `{ status: approved\|answered\|rejected }`. |
| POST | `/prayers/:id/respond` | `[pastor+]` | `{ message }` → notifie l'auteur. |

### 3.7 Events — `/events`

| Méthode | Chemin | Rôle | Description |
| --- | --- | --- | --- |
| GET | `/events` | `[member]` | Liste (`Events`). Inclut `rsvpCount`, `myRsvp`. |
| GET | `/events/:id` | `[member]` | Détail (`EventDetail`). |
| POST | `/events/:id/rsvp` | `[member]` | `{ status: going\|cancelled }`. |
| POST | `/events` | `[pastor+]` | Crée. |
| PATCH | `/events/:id` | `[pastor+]` | MAJ. |

### 3.8 Giving : dons + funds + wallet — `/giving`

| Méthode | Chemin | Rôle | Description |
| --- | --- | --- | --- |
| GET | `/giving/funds` | `[member]` | Liste des fonds (`GiveFund`). |
| GET | `/giving/payment-methods` | `[member]` | Méthodes de paiement (`GiveMethod`). |
| POST | `/giving/donations` | `[member]` | `{ amount, fundId, method, anonymous? }` → crée don `pending`, initie paiement provider. (`GiveAmount`→`GiveSuccess`.) |
| GET | `/giving/donations` | `[member]` | Historique du membre (`GiveHistory`). |
| GET | `/giving/donations/:id` | `[member]` | Reçu (`GiveReceipt`). |
| POST | `/giving/webhooks/:provider` | `[public+signature]` | Webhook provider (signé). Met `status` à `received`/`failed`. |
| GET | `/giving/wallet` | `[member]` | Wallet (`Wallet`) : `balanceCoins`, `pendingTopupCoins`, `defaultFund`, `recent`. |
| POST | `/giving/wallet/topup` | `[member]` | `{ coins, method }` (`WalletTopup`) → transaction `pending`. |
| PATCH | `/giving/wallet/default-fund` | `[member]` | `{ fundId }`. |
| GET | `/giving/wallet/transactions` | `[member]` | Transactions paginées. |
| GET | `/giving/admin/donations` | `[pastor+]` | Tous les dons (dashboard Giving), filtres fund/channel/status. |
| GET | `/giving/admin/summary` | `[pastor+]` | KPIs dons : funds (budget/ytd), channels, MTD. |
| GET | `/giving/admin/export` | `[admin]` | Export CSV financier. |

### 3.9 Appointments — `/appointments`

| Méthode | Chemin | Rôle | Description |
| --- | --- | --- | --- |
| GET | `/appointments/topics` | `[member]` | Topics (`BookTopic`). |
| GET | `/appointments/slots` | `[member]` | Créneaux dispo (`BookSlot`), `?from=&to=`. |
| POST | `/appointments` | `[member]` | `{ topicId, slotStart, notes? }` (`BookConfirm`) → `tentative`. |
| GET | `/appointments/mine` | `[member]` | Mes RDV (`MyAppointments`). |
| DELETE | `/appointments/:id` | `[member]` | Annule. |
| GET | `/appointments` | `[pastor+]` | Agenda staff (dashboard Care). |
| PATCH | `/appointments/:id` | `[pastor+]` | `{ status, pastorId, slotStart, location }`. |

### 3.10 Notifications — `/notifications`

| Méthode | Chemin | Rôle | Description |
| --- | --- | --- | --- |
| GET | `/notifications` | `[member]` | Liste groupée (`Notifications`). |
| POST | `/notifications/read` | `[member]` | `{ ids?: string[] }` (tous si vide). |
| POST | `/notifications/broadcast` | `[pastor+]` | `{ audience, title, body }` → push Expo (dashboard). |

### 3.11 Dashboard transverse — `/admin`

| Méthode | Chemin | Rôle | Description |
| --- | --- | --- | --- |
| GET | `/admin/overview` | `[pastor+]` | KPIs (`kpis`) : members, giving MTD, viewers, prayer queue, devo completion. |
| GET | `/admin/engagement` | `[pastor+]` | Métriques engagement (`engagement`). |
| GET | `/admin/activity` | `[pastor+]` | Flux d'activité paginé (`activity`). |
| GET | `/admin/content/upcoming` | `[pastor+]` | Contenu planifié (`upcomingContent`). |

### 3.12 Référence & santé

| Méthode | Chemin | Rôle | Description |
| --- | --- | --- | --- |
| GET | `/health` | `[public]` | Statut + connectivité DB/Redis. |
| GET | `/reference/service-times` | `[public]` | Horaires (`ServiceTimes`). |
| GET | `/reference/about` | `[public]` | Contenu À propos / Contact (`About`, `Contact`). |

---

## 4. Flux clés

- **Onboarding OTP** : `POST /auth/otp/request` → `POST /auth/otp/verify` (tokens) → si `isNewUser` : `PATCH /users/me` + `PUT /users/me/interests` → `POST /users/me/push-tokens`.
- **Don de bout en bout** : `POST /giving/donations` (`pending`) → paiement provider → `POST /giving/webhooks/:provider` (`received`) → push + apparition dashboard Giving.
- **Amen live** : WS connecté → `POST /live/:id/amen` (débit wallet) → broadcast `amen:new` à tous.
- **Prière privée** : `POST /prayers` (`private`) → file `GET /prayers/queue` → `PATCH /prayers/:id/status` + `POST /prayers/:id/respond` → notif auteur.

---

## 5. Critère de couverture

100 % des écrans mobiles (§ matrice) et panneaux dashboard (Overview, Care, Giving, People, Content, Activity) sont desservis par ≥ 1 endpoint ci-dessus. Voir [`screen-endpoint-matrix.md`](./screen-endpoint-matrix.md).

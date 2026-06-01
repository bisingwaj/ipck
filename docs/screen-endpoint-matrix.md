# docs/screen-endpoint-matrix.md — Matrice écran ↔ endpoint (Phase 1)

> Vérifie qu'aucun écran n'est sans source de données et qu'aucun endpoint n'est orphelin.
> Endpoints détaillés dans [`api-spec.md`](./api-spec.md). Base : `/api/v1`.

## Mobile — `IPCKConnectMobile/`

### Onboarding
| Écran | Endpoint(s) |
| --- | --- |
| Splash | `GET /auth/me` (si token présent → garde d'auth) |
| Onboarding / SignUp | — (statique) |
| Phone | `POST /auth/otp/request` |
| OTP | `POST /auth/otp/verify` |
| ProfileSetup | `PATCH /users/me` |
| Interests | `PUT /users/me/interests` |
| NotifPermission | `POST /users/me/push-tokens` |
| Welcome | — (statique) |

### Today
| Écran | Endpoint(s) |
| --- | --- |
| TodayHome | `GET /devotionals/today`, `GET /users/me/streak`, `GET /sermons?live=true` |
| Devotional | `GET /devotionals/:id` (ou `/today`) |
| PastDevotionals | `GET /devotionals` |
| Streak | `GET /users/me/streak` |
| Prayed | `POST /devotionals/:id/read` |

### Watch
| Écran | Endpoint(s) |
| --- | --- |
| WatchList | `GET /sermons` |
| SermonDetail | `GET /sermons/:id` |
| Live | `GET /live/current`, `GET /live/:id/amens`, `POST /live/:id/amen`, WS `live` |

### Give
| Écran | Endpoint(s) |
| --- | --- |
| GiveHome | `GET /giving/funds`, `GET /giving/wallet` |
| GiveAmount | — (état local) |
| GiveFund | `GET /giving/funds` |
| GiveMethod | `GET /giving/payment-methods` |
| GiveMomoConfirm / GiveMomoPrompt | `POST /giving/donations` |
| GiveCard | `POST /giving/donations` |
| GiveSuccess | `GET /giving/donations/:id` |
| GiveReceipt | `GET /giving/donations/:id` |
| GiveHistory | `GET /giving/donations` |
| Wallet | `GET /giving/wallet`, `GET /giving/wallet/transactions`, `PATCH /giving/wallet/default-fund` |
| WalletTopup | `POST /giving/wallet/topup` |

### Community
| Écran | Endpoint(s) |
| --- | --- |
| CommunityHome | `GET /groups?mine=true`, `GET /prayers`, `GET /events` |
| GroupsList | `GET /groups` |
| GroupDetail | `GET /groups/:id`, `POST /groups/:id/join`, `DELETE /groups/:id/leave` |
| GroupChat | `GET /groups/:id/messages`, `POST /groups/:id/messages`, `POST /groups/:id/read`, WS `chat:message` |
| PrayerWall | `GET /prayers`, `POST /prayers/:id/amen` |
| PrayerDetail | `GET /prayers/:id`, `POST /prayers/:id/amen` |
| SubmitPrayer | `POST /prayers` |
| Events | `GET /events` |
| EventDetail | `GET /events/:id`, `POST /events/:id/rsvp` |

### Profile
| Écran | Endpoint(s) |
| --- | --- |
| ProfileHome | `GET /auth/me` |
| About | `GET /reference/about` |
| ServiceTimes | `GET /reference/service-times` |
| Contact | `GET /reference/about` |
| BookTopic | `GET /appointments/topics` |
| BookSlot | `GET /appointments/slots` |
| BookConfirm | `POST /appointments` |
| BookSuccess | `GET /appointments/mine` |
| MyAppointments | `GET /appointments/mine`, `DELETE /appointments/:id` |
| Notifications | `GET /notifications`, `POST /notifications/read` |
| Settings | `PATCH /users/me`, `DELETE /users/me/push-tokens/:token` |

## Dashboard — `IPCKHouse-Dashboard/` (→ `IPCKAdmin/`)

| Panneau | Endpoint(s) |
| --- | --- |
| Overview (KPIs) | `GET /admin/overview`, `GET /live/current`, `GET /admin/engagement` |
| Care — prières | `GET /prayers/queue`, `PATCH /prayers/:id/status`, `POST /prayers/:id/respond` |
| Care — rendez-vous | `GET /appointments`, `PATCH /appointments/:id` |
| Giving (analytics) | `GET /giving/admin/summary`, `GET /giving/admin/donations`, `GET /giving/admin/export` |
| People | `GET /users`, `GET /users/new`, `GET /admin/engagement` |
| Community — groupes | `GET /groups`, `POST /groups`, `GET /groups/:id/members`, `POST /groups/:id/members`, `DELETE /groups/:id/members/:userId` |
| Community — événements | `GET /events`, `POST /events` |
| Content | `GET /admin/content/upcoming`, `POST /devotionals`, `PATCH /devotionals/:id`, `POST /sermons`, `PATCH /sermons/:id` |
| Activity | `GET /admin/activity` |
| Live (régie) | `GET /live/current`, `PATCH /live/:id`, WS `viewers:update` |
| Broadcast | `POST /notifications/broadcast` |

## Vérification croisée

- **Écrans sans source de données** : aucun (les écrans statiques sont marqués « — »).
- **Endpoints orphelins** : aucun — chaque endpoint de `api-spec.md` est référencé par ≥ 1 écran/panneau ci-dessus.
- **Couverture** : 100 % des écrans mobiles (6 domaines) et des 6 panneaux dashboard + live/broadcast.

# docs/mobile-integration.md — Intégration de l'API dans l'app mobile (Phase 4)

> **But** : remplacer les données mockées de `IPCKConnectMobile/src/data/mock.ts` par l'API réelle **sans casser l'UI existante**.
> **Principe non destructif** : on n'édite pas les écrans ; on ajoute une couche `src/api/` dont les hooks renvoient **la même forme de données que `mock.ts`**. Un écran passe de `import { x } from '@/data/mock'` à `const { data: x } = useX()`.
> **Ce document est un guide** : les modifications du code mobile sont réalisées par l'équipe mobile (hors périmètre backend).

---

## 1. Dépendances à ajouter (mobile)

```bash
cd IPCKConnectMobile
npx expo install @tanstack/react-query expo-secure-store expo-notifications
npm install axios
```

Toutes compatibles Expo SDK 52.

## 2. Variables d'environnement

`IPCKConnectMobile/.env` (préfixe `EXPO_PUBLIC_*`) :

```
EXPO_PUBLIC_API_URL=http://<ip-locale>:3333/api/v1   # 3333 en dev local (3000 occupé par Supabase)
EXPO_PUBLIC_USE_MOCKS=false                            # true = fixtures locales (fallback)
```

> Sur appareil physique, `<ip-locale>` = IP LAN de la machine (pas `localhost`). Le WebSocket live est sur `ws://<ip-locale>:3333/live`.

## 3. Fichiers à créer (couche API)

| Fichier | Rôle |
| --- | --- |
| `src/api/client.ts` | Instance `axios` : `baseURL = EXPO_PUBLIC_API_URL`, intercepteur d'injection du token, refresh automatique sur 401 (file d'attente). |
| `src/auth/AuthContext.tsx` | Contexte d'auth : tokens persistés via `expo-secure-store`, `signIn`/`signOut`, état `isAuthenticated`. |
| `src/api/queryClient.ts` | `QueryClient` TanStack (staleTime, retry). `App.tsx` wrappé dans `<QueryClientProvider>` + `<AuthProvider>`. |
| `src/api/hooks/*.ts` | Un fichier par domaine ; chaque hook renvoie la **forme `mock.ts`**. |

### Squelette `client.ts`

```ts
import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

export const api = axios.create({ baseURL: process.env.EXPO_PUBLIC_API_URL });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
// + intercepteur de réponse 401 → POST /auth/refresh → rejoue la requête
```

## 4. Flux OTP réel (PhoneScreen / OTPScreen)

1. `PhoneScreen` → `POST /auth/otp/request { phone }` (E.164, ex. `+243…`).
2. `OTPScreen` → `POST /auth/otp/verify { phone, code }` → stocke `accessToken`/`refreshToken` (SecureStore), MAJ `AuthContext`.
3. Si `isNewUser` : poursuivre l'onboarding (`ProfileSetup` → `PATCH /users/me`, `Interests` → `PUT /users/me/interests`).
4. `NotifPermissionScreen` → enregistrer le token push : `POST /users/me/push-tokens { expoToken, platform }`.
5. **Garde d'auth** dans `RootNavigator` : si `isAuthenticated` → `Main`, sinon flux onboarding (rendu conditionnel ; signatures de routes inchangées).

## 5. Matrice écran → hook → endpoint

| Écran | Hook proposé | Endpoint(s) |
| --- | --- | --- |
| TodayHome | `useTodayDevotional`, `useStreak`, `useLiveSermon` | `GET /devotionals/today`, `GET /users/me/streak`, `GET /sermons?live=true` |
| Devotional / PastDevotionals | `useDevotional(id)`, `useDevotionals` | `GET /devotionals/:id`, `GET /devotionals` |
| Prayed / Streak | `useMarkRead`, `useStreak` | `POST /devotionals/:id/read`, `GET /users/me/streak` |
| WatchList / SermonDetail | `useSermons`, `useSermon(id)` | `GET /sermons`, `GET /sermons/:id` |
| Live | `useLiveSession`, `useSendAmen`, WS | `GET /live/current`, `GET /live/:id/amens`, `POST /live/:id/amen`, WS `amen:new` |
| GiveHome / GiveFund / GiveMethod | `useFunds`, `usePaymentMethods` | `GET /giving/funds`, `GET /giving/payment-methods` |
| Give* (confirm) / GiveSuccess / GiveReceipt | `useCreateDonation`, `useDonation(id)` | `POST /giving/donations`, `GET /giving/donations/:id` |
| GiveHistory | `useDonations` | `GET /giving/donations` |
| Wallet / WalletTopup | `useWallet`, `useTopup`, `useSetDefaultFund` | `GET /giving/wallet`, `POST /giving/wallet/topup`, `PATCH /giving/wallet/default-fund` |
| CommunityHome / GroupsList / GroupDetail | `useGroups`, `useGroup(id)`, `useJoin/useLeave` | `GET /groups`, `GET /groups/:id`, `POST /groups/:id/join`, `DELETE /groups/:id/leave` |
| GroupChat | `useMessages`, `useSendMessage`, WS | `GET /groups/:id/messages`, `POST /groups/:id/messages`, `POST /groups/:id/read`, WS `chat:message` |
| PrayerWall / PrayerDetail / SubmitPrayer | `usePrayers`, `usePrayer(id)`, `useToggleAmen`, `useSubmitPrayer` | `GET /prayers`, `GET /prayers/:id`, `POST /prayers/:id/amen`, `POST /prayers` |
| Events / EventDetail | `useEvents`, `useRsvp` | `GET /events`, `GET /events/:id`, `POST /events/:id/rsvp` |
| BookTopic / BookSlot / BookConfirm / MyAppointments | `useTopics`, `useSlots`, `useBook`, `useMyAppointments` | `GET /appointments/topics`, `GET /appointments/slots`, `POST /appointments`, `GET /appointments/mine`, `DELETE /appointments/:id` |
| Notifications | `useNotifications`, `useMarkNotificationsRead` | `GET /notifications`, `POST /notifications/read` |
| About / ServiceTimes / Contact | `useAbout`, `useServiceTimes` | `GET /reference/about`, `GET /reference/service-times` |
| ProfileHome / Settings | `useMe`, `useUpdateProfile` | `GET /auth/me`, `PATCH /users/me` |

> **Forme des données** : le backend renvoie déjà des champs alignés sur `mock.ts` quand c'est possible (`who`, `initials`, `amen`, `iPrayed`, `when`, `balanceCoins`, `recent`, `members`, `unread`, `lastMessage`…). Les listes paginées renvoient `{ data, page, pageSize, total }` → le hook expose `data.data` (ou aplati selon l'écran).

## 6. Conserver `mock.ts` comme fallback

Garder `mock.ts` intact. Dans chaque hook :

```ts
if (process.env.EXPO_PUBLIC_USE_MOCKS === 'true') return { data: mockValue, isLoading: false };
```

Permet de développer/démo sans backend, et de comparer mock ↔ API.

## 7. Push Expo

Après permission accordée :

```ts
const token = (await Notifications.getExpoPushTokenAsync()).data;
await api.post('/users/me/push-tokens', { expoToken: token, platform: Platform.OS });
```

Le backend stocke le token (`PushToken`) et l'utilise pour les broadcasts (`POST /notifications/broadcast`, staff).

## 8. Tests d'intégration (critères Phase 4)

- Login OTP réel (code visible dans les logs backend en dev — provider `console`).
- Chargement dévotion / sermons / groupes sur données réelles.
- **Un don de bout en bout** : `POST /giving/donations` → statut `received` (provider mock) → apparaît dans `GiveHistory`.
- Réception d'un **push de test** (broadcast staff → appareil enregistré).
- Token **persistant** entre redémarrages (SecureStore).

> Collection prête à l'emploi : [`ipck.postman_collection.json`](./ipck.postman_collection.json) (importable dans Postman/Insomnia).

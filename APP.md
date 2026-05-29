# APP.md — Architecture technique des frontends IPCK

> Ce document décrit l'architecture technique **des frontends existants** du projet IPCK
> (application mobile + dashboard admin) et les instructions de build.
> Le backend n'existe pas encore : voir [`BACKEND_PLAN.md`](./BACKEND_PLAN.md) pour le plan de construction.

---

## 1. Vue d'ensemble

Le dépôt `IPCK-APP/` regroupe **deux frontends** destinés à l'**International Protestant Church of Kinshasa (IPCK)**, et **aucun backend** à ce stade. Toutes les données sont actuellement **mockées en local**.

| Sous-projet | Rôle | Public | Techno |
| --- | --- | --- | --- |
| [`IPCKConnectMobile/`](./IPCKConnectMobile/) | App mobile « IPCK Connect » | Membres de l'église | Expo / React Native / TypeScript |
| [`IPCKHouse-Dashboard/`](./IPCKHouse-Dashboard/) | Dashboard admin « IPCK House » | Staff (pasteurs, admin) | React + IBM Carbon (servi via CDN) |

**Fonctionnalités couvertes par l'app mobile** : onboarding (téléphone + OTP), dévotions quotidiennes & streak, sermons & culte en direct, dons (offrandes) avec wallet « Amen coins » et mobile money, communauté (groupes, chat, mur de prière, événements), profil & prise de rendez-vous pastoraux.

---

## 2. Stack & dépendances clés (mobile)

Source : [`IPCKConnectMobile/package.json`](./IPCKConnectMobile/package.json).

| Dépendance | Version | Rôle | Statut de maintenance |
| --- | --- | --- | --- |
| `expo` | `~52.0.0` | SDK / toolchain (Metro, EAS, modules natifs) | ✅ SDK actif |
| `react` | `18.3.1` | Bibliothèque UI | ✅ |
| `react-native` | `0.76.5` | Runtime mobile (New Architecture par défaut sur RN 0.76) | ✅ |
| `expo-status-bar` | `~2.0.0` | Barre de statut | ✅ |
| `expo-font` | `~13.0.0` | Chargement de polices | ✅ |
| `expo-linear-gradient` | `~14.0.0` | Dégradés | ✅ |
| `react-native-safe-area-context` | `4.12.0` | Zones sûres (encoches) | ✅ |
| `react-native-screens` | `~4.4.0` | Écrans natifs (perf navigation) | ✅ |
| `react-native-svg` | `15.8.0` | SVG (icônes maison) | ✅ |
| `react-native-gesture-handler` | `~2.20.2` | Gestes | ✅ |
| `@react-navigation/native` | `^7.0.0` | Cœur navigation | ✅ v7 |
| `@react-navigation/native-stack` | `^7.0.0` | Pile native | ✅ |
| `@react-navigation/bottom-tabs` | `^7.0.0` | Onglets bas | ✅ |

**Dev** : `typescript ^5.3.3`, `@types/react ~18.3.12`, `@babel/core ^7.25.0`.

> Toutes les versions sont alignées sur Expo SDK 52 et activement maintenues. Aucune dépendance obsolète détectée. Il n'y a **pas de lockfile** committé (`package-lock.json`/`pnpm-lock.yaml` à générer).

**Choix techniques notables :**
- **TypeScript strict** ([`tsconfig.json`](./IPCKConnectMobile/tsconfig.json)) avec alias de chemin `@/* → src/*`.
- **React Navigation v7** (et non Expo Router) : navigation pilotée par code dans `RootNavigator`.
- **StyleSheet natif + design tokens** (pas de NativeWind / styled-components / lib UI tierce).
- État **local uniquement** (`useState`) : pas de Redux/Zustand/Context global ni de data-layer — point d'entrée prévu pour le backend.

---

## 3. Architecture de l'app mobile

### Arborescence (`IPCKConnectMobile/`)

```
IPCKConnectMobile/
├── App.tsx                  # Racine : SafeAreaProvider + NavigationContainer + chargement polices
├── index.ts                 # Point d'entrée Expo (registerRootComponent)
├── app.json                 # Configuration Expo
├── babel.config.js          # Preset babel-preset-expo
├── tsconfig.json            # TS strict + alias @/*
├── package.json
├── README.md                # Doc d'origine du sous-projet (conservée)
└── src/
    ├── components/          # Primitives UI réutilisables (Button, TopBar, Icon, Field, Card,
    │                        #   Pill, ScreenContainer, TabBar, BrandMark, GeoArt) + index.ts
    ├── data/
    │   └── mock.ts          # TOUTES les données mockées + types métier
    ├── navigation/
    │   ├── RootNavigator.tsx # Stack (onboarding) + Bottom Tabs (app)
    │   └── types.ts          # RootStackParamList / MainTabParamList (routes typées)
    ├── screens/             # Écrans par domaine (feature-based)
    │   ├── onboarding/      # Splash, Onboarding, SignUp, Phone, OTP, ProfileSetup,
    │   │                    #   Interests, NotifPermission, Welcome
    │   ├── today/           # TodayHome, Devotional, PastDevotionals, Streak, Prayed
    │   ├── watch/           # WatchList, SermonDetail, Live
    │   ├── give/            # GiveHome, GiveAmount, GiveFund, GiveMethod, GiveMomoConfirm,
    │   │                    #   GiveMomoPrompt, GiveCard, GiveSuccess, GiveReceipt,
    │   │                    #   GiveHistory, Wallet, WalletTopup
    │   ├── community/       # CommunityHome, GroupsList, GroupDetail, GroupChat,
    │   │                    #   PrayerWall, PrayerDetail, SubmitPrayer, Events, EventDetail
    │   └── profile/         # ProfileHome, About, ServiceTimes, Contact, BookTopic, BookSlot,
    │                        #   BookConfirm, BookSuccess, MyAppointments, Notifications, Settings
    └── theme/
        ├── tokens.ts        # Couleurs, espacements, rayons
        ├── typography.ts    # Presets typographiques (IBM Plex)
        └── fonts.ts         # useLoadFonts() (polices IBM Plex actuellement commentées)
```

### Navigation

Définie dans [`src/navigation/RootNavigator.tsx`](./IPCKConnectMobile/src/navigation/RootNavigator.tsx) et typée dans [`src/navigation/types.ts`](./IPCKConnectMobile/src/navigation/types.ts).

- **Stack racine** (`RootStackParamList`) : démarre sur `Splash`, déroule le flux d'onboarding, puis pousse l'écran `Main`. Les écrans de détail (Devotional, SermonDetail, Give*, Group*, Book*, etc.) sont des routes du stack racine accessibles depuis les onglets.
- **Bottom Tabs** (`MainTabParamList`) : 5 onglets — `TodayHome`, `WatchList`, `GiveHome`, `CommunityHome`, `ProfileHome`.
- Les routes paramétrées sont typées (ex. `SermonDetail: { id: string }`, `OTP: { phone?: string }`) — utile pour brancher des identifiants serveur sans changer les signatures.

### État & données

- État **local** par écran via `useState` (formulaires, onglets internes, sélections).
- **Aucun** store global, **aucun** appel réseau, **aucune** persistance disque.
- Source de vérité actuelle : [`src/data/mock.ts`](./IPCKConnectMobile/src/data/mock.ts), qui exporte aussi les **types métier** (voir §5).

---

## 4. Design system

### Tokens — [`src/theme/tokens.ts`](./IPCKConnectMobile/src/theme/tokens.ts)

- **Couleurs** : primary `#1F6FEB`, accent `#FFB020`, fond `#F7F5F0`, surface `#EFEDE6`, textes `#14181F` / `#6A7384` / `#9CA4B3`, bordures `#DCE0E7` / `#E8E4DC`, statuts success `#1FB36A` / warning `#FFB020` / error `#E5484D`.
- **Espacements** : `s1=4` … `s8=32`.
- **Rayons** : `6 / 10 / 14 / 18 / 999 (pill)`.

### Typographie — [`src/theme/typography.ts`](./IPCKConnectMobile/src/theme/typography.ts)

Famille **IBM Plex** (Serif pour les titres, Sans pour le corps/UI, Mono pour les références de versets). Presets : `h1`, `h2`, `h3`, `serif18`, `serifLead`, `title`, `body`, `bodyStrong`, `caption`, `small`, `micro`, `eyebrow`, `mono`.

### Polices — [`src/theme/fonts.ts`](./IPCKConnectMobile/src/theme/fonts.ts)

Le hook `useLoadFonts()` est appelé dans `App.tsx`, mais **les `Font.loadAsync()` des polices IBM Plex sont commentés** : l'app retombe sur les polices système. Pour activer IBM Plex :
1. Déposer les fichiers `.ttf` dans `IPCKConnectMobile/assets/fonts/`.
2. Décommenter les lignes correspondantes dans `fonts.ts`.

### Composants réutilisables — [`src/components/`](./IPCKConnectMobile/src/components/)

`Button` (variantes primary/secondary/tertiary/danger/ghost, tailles sm/md/lg), `TopBar`, `ScreenContainer` (layout + safe area + footer), `Icon` (SVG maison), `Field`, `Card`, `Pill`, `BrandMark` (logo), `GeoArt` (illustrations géométriques), `TabBar`. Tous ré-exportés via `src/components/index.ts`.

---

## 5. Couche de données actuelle (point d'intégration backend)

Tout vient de [`src/data/mock.ts`](./IPCKConnectMobile/src/data/mock.ts), qui définit aussi les types. **Entités métier** identifiées (blueprint pour le schéma backend) :

`User` (téléphone, profil, intérêts) · `Devotional` (verset, corps, prière, étapes) · `Sermon` (titre, prédicateur, série, live) · `Group` (membres, dernier message, leader) · `GroupMessage` · `Prayer` (visibilité public/anon/private, amens) · `ChurchEvent` (RSVP, capacité) · `Fund` (général/bâtiment/missions/bénévolence) · `PaymentMethod` (momo/carte) · `Donation` / `GiftHistory` · `AmenWallet` + `AmenTransaction` (topup/amen/redeem/refund) · `Appointment` (créneaux pastoraux) · `Notification` · `ActivityLog`.

**Implications backend** (détaillées dans `BACKEND_PLAN.md`) : auth téléphone+OTP, paiements mobile money (M-Pesa, Airtel, Orange, Afrimoney) + carte, temps réel (chat, amens live), push, upload (avatars, vignettes).

---

## 6. Dashboard admin — `IPCKHouse-Dashboard/`

- **React 18 servi via CDN + Babel in-browser**, **IBM Carbon Design System**, fichiers **JSX (sans TypeScript)**, données mockées.
- Navigation par onglets : Overview, Care (file de prières, rendez-vous), Giving (analytics dons), People, Content (planification), Activity.
- Fichiers clés : `index.html`, `src/data.jsx` (mock), `src/shell.jsx`, `src/dashboard.jsx`, `src/dashboard-panels.jsx`, `src/icons.jsx`, `carbon-tokens.css`, `carbon-shell.css`.
- Lancement local : `npx serve .` ou `python -m http.server` depuis le dossier.

> ⚠️ L'approche CDN convient au prototype mais **n'est pas adaptée à la production**. La [Phase 5 de `BACKEND_PLAN.md`](./BACKEND_PLAN.md) recommande de migrer vers un build **Vite + React + TypeScript + Carbon** (dans un nouveau dossier, sans modifier l'existant) branché sur l'API.

---

## 7. Instructions de build (mobile)

### Développement

```bash
cd IPCKConnectMobile
npm install            # (génère le lockfile manquant)
npm run start          # Expo dev server (QR + Expo Go)
npm run android        # ouvre sur émulateur/appareil Android
npm run ios            # ouvre sur simulateur iOS (macOS)
npm run web            # build web Metro
```

> RN 0.76 active la **New Architecture** ; certains modules natifs nécessitent un *development build* (et non Expo Go) — à valider lors de l'ajout des dépendances backend (paiement, secure-store, push).

### Preview & Production via EAS Build

EAS n'est **pas encore configuré** (pas de `eas.json`). À mettre en place (voir Phase 6) :

```bash
npm install -g eas-cli
eas login
eas build:configure        # crée eas.json (profils development / preview / production)
```

Profils cibles recommandés dans `eas.json` :
- **development** : *dev client* pour tester les modules natifs.
- **preview** : artefact interne installable — **APK** (Android) + build **ad hoc / TestFlight** (iOS).
- **production** : **AAB** (Android, pour le Play Store) + **IPA** (iOS, App Store / TestFlight).

```bash
eas build --profile preview    --platform android   # APK
eas build --profile production --platform android   # AAB
eas build --profile production --platform ios        # IPA
eas submit --platform android   # (optionnel) soumission Play
eas submit --platform ios        # (optionnel) soumission App Store
```

**Identifiants applicatifs** (déjà dans [`app.json`](./IPCKConnectMobile/app.json)) : iOS `cd.ipck.connect`, Android `cd.ipck.connect`, scheme `ipckconnect`.

**Certificats / signature** : laisser **EAS gérer les credentials** (keystore Android, certificats/profils iOS) — ne jamais committer de secrets. Les comptes Apple Developer / Google Play Console sont requis pour la soumission stores.

### Variables d'environnement

Préfixe **`EXPO_PUBLIC_*`** pour exposer une variable au bundle client. À définir lors de l'intégration backend (voir Phase 4) :

| Variable | Usage |
| --- | --- |
| `EXPO_PUBLIC_API_URL` | Base URL de l'API backend |
| `EXPO_PUBLIC_USE_MOCKS` | `true`/`false` — bascule mock ↔ API réelle |

> Les **secrets** (clés providers, etc.) ne doivent jamais être en `EXPO_PUBLIC_*` ni dans le bundle : ils vivent côté backend.

---

## 8. Limites connues / dette

- ❌ Pas de backend, pas d'appels réseau, pas de persistance (100 % mock).
- ❌ Pas de tests automatisés (mobile ni dashboard).
- ❌ Pas d'i18n (textes en anglais en dur) ni de dark mode.
- ❌ Pas de lockfile committé ; dépôt non versionné git.
- ❌ Polices IBM Plex non chargées (fallback système).
- ⚠️ Dashboard servi via CDN (à migrer pour la production).
```

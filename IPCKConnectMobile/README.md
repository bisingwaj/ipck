# IPCK Connect — Mobile (React Native / Expo)

Member-facing mobile app for the **International Protestant Church of Kinshasa**, converted page-by-page from the HTML design prototype to a real React Native + Expo + TypeScript project.

## Quick start

```bash
npm install
npx expo start
```

Then press `i` (iOS sim), `a` (Android emulator), or scan the QR with **Expo Go**.

## Project structure

```
src/
├── theme/          design tokens — single source of truth
├── components/     shared UI primitives
├── data/           mock content
├── navigation/     React Navigation graph
└── screens/        one folder per section, one .tsx file per page
    ├── onboarding/  Splash · Onboarding · Signup · Phone · OTP · Profile · Interests · Notif · Welcome
    ├── today/       Home · Devotional · Past · Streak · Prayed
    ├── watch/       Sermons list · Sermon detail · Live
    ├── give/        Home · Amount · Fund · Method · Mobile-money · Card · Success · Receipt · History
    ├── community/   Home · Groups · Group detail · Group chat · Prayer wall · Submit · Events
    └── profile/     Home · About · Service times · Contact · Book appointment · My appointments · Notifications
```

## Design tokens

All colors, font sizes, spacing and radii live in `src/theme/tokens.ts`.
Primary **#1F6FEB**, Accent **#FFB020**, Editorial ink **#14181F**.

## Fonts

We use **IBM Plex Sans / Serif / Mono**. Drop `.ttf` files into `assets/fonts/` and uncomment the loader in `src/theme/fonts.ts`. Without them, the app falls back to system fonts.

## Page-by-page index

Each screen file under `src/screens/` exports a default component matching its route in `src/navigation/RootNavigator.tsx`. To wire to a real backend, replace `src/data/mock.ts` with API calls.

## What's included

✅ Every member-facing flow
✅ React Navigation (stack + bottom tabs)
✅ Typed routes
✅ Mock data so every screen renders
✅ Design tokens + reusable components
✅ Mobile money flow UI (Airtel / M-Pesa / Orange / Afrimoney)

## What's not included

- Backend integration · Real payment SDKs · Push notification backend · Tests

— These are intentional. Start by wiring screens to your actual backend.

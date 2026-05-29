# docs/e2e-plan.md — Plan de tests de bout en bout (Phase 7)

> Valide les parcours critiques sur **Android + iOS** (app mobile), le **dashboard**, et l'**API**.

## 1. Couches de test

| Couche | Outil | Emplacement | État |
| --- | --- | --- | --- |
| API (intégration) | Supertest + Jest | `backend/test/*.e2e-spec.ts` | ✅ auth + giving + health (14 tests) |
| Services (unitaire) | Jest | `backend/src/**/*.spec.ts` | ✅ OTP + wallet + tokens (14 tests) |
| UI mobile (flows) | Maestro | `.maestro/*.yaml` | ⏳ squelette fourni |
| Dashboard | manuel + `vite build` | — | ✅ build vert |

## 2. Scénarios critiques

| # | Scénario | Étapes | Vérif |
| --- | --- | --- | --- |
| S1 | Onboarding OTP | Phone → request OTP → verify → profil → intérêts → push | Token persistant, `Main` affiché |
| S2 | Dévotion du jour | TodayHome → Devotional → « prayed » | Streak incrémenté (`/users/me/streak`) |
| S3 | Sermons / Live | WatchList → SermonDetail ; Live → envoi amen | Wallet débité, amen diffusé (WS) |
| S4 | Don mobile money | GiveAmount → Fund → Method → confirm | Don `received`, visible dans GiveHistory + dashboard Giving |
| S5 | Wallet top-up | Wallet → Topup (M-Pesa) | Solde crédité après règlement |
| S6 | Chat de groupe | GroupChat → envoi message | Message diffusé (WS), `unread` remis à 0 |
| S7 | Mur de prière | PrayerWall → amen ; SubmitPrayer (private) | amen togglé ; prière privée en file de care |
| S8 | RSVP événement | Events → EventDetail → RSVP | `rsvp` incrémenté, `myRsvp=going` |
| S9 | Rendez-vous | BookTopic → BookSlot → confirm | RDV `tentative` dans MyAppointments + agenda staff |
| S10 | Push | Broadcast staff → appareil | Notification reçue + listée |
| A1 | Admin prière | Dashboard Care → approuver / répondre | Statut MAJ, notif à l'auteur |
| A2 | Admin contenu | Dashboard Content → planifier dévotion | Apparaît dans `content/upcoming` |
| A3 | Admin export | Dashboard Giving → export | CSV téléchargé |

## 3. Exécution API (CI + local)

```bash
cd backend
docker compose up -d            # (depuis la racine)
pnpm prisma:deploy && pnpm seed
pnpm test          # unitaires
pnpm test:e2e      # intégration (DB+Redis réels)
```

## 4. Maestro (mobile)

Pré-requis : `curl -Ls "https://get.maestro.mobile.dev" | bash`, émulateur Android / simulateur iOS, build EAS `development`/`preview` installé.

```bash
maestro test .maestro/onboarding.yaml
maestro test .maestro/give.yaml
```

> Les flows utilisent le compte démo `+243810000099` ; le code OTP est lu dans les logs backend (provider `console`) en environnement de test, ou saisi manuellement.

## 5. Check-list manuelle iOS / Android (build EAS preview)

- [ ] Installation APK (Android) / TestFlight (iOS) sans crash au lancement.
- [ ] Onboarding OTP complet, token persistant après redémarrage.
- [ ] S2–S10 déroulés sur les deux OS.
- [ ] Dashboard : Overview/Care/Giving sur données réelles, actions persistées.
- [ ] Journal de bugs tenu (issues GitHub) ; bugs **bloquants** corrigés avant démo.

## 6. Critères de succès

Tous les scénarios critiques passent sur Android + iOS + dashboard ; suites API vertes en CI ; aucun bug bloquant ouvert.

# docs/DEMO.md — Scénario de démonstration IPCK

> Démo reproductible en **une commande de seed**. Providers en **mode sandbox** (SMS `console`, paiement `mock`).

## 1. Préparer l'environnement de démo

```bash
# Racine du dépôt
docker compose up -d                      # Postgres + Redis

cd backend
cp .env.example .env                      # PORT=3333 en local (3000 pris par Supabase)
pnpm install && pnpm prisma:generate
pnpm prisma:deploy                        # applique les migrations
pnpm seed                                 # SEED reproductible (remet les données à zéro puis réinsère)
pnpm dev                                  # API sur http://localhost:3333 (docs: /docs)

# Dashboard (autre terminal)
cd IPCKAdmin && cp .env.example .env && pnpm install && pnpm dev   # http://localhost:5173
```

> **Réinitialiser à tout moment** : `pnpm prisma:reset` (re-seed propre). Données reproductibles à l'identique.

## 2. Comptes de démo

| Rôle | Téléphone | Usage |
| --- | --- | --- |
| Membre | `+243810000099` | Parcours mobile (Demo Member, wallet 47 coins, streak 4) |
| Group leader | `+243810000010` | Grace Mbuyi (leader Worship) |
| Pasteur | `+243810000001` | Dashboard (Care, Giving, Overview) |
| Admin | `+243810000003` | Dashboard + exports |

> **OTP** : en mode `console`, le code s'affiche dans les **logs du backend** après `POST /auth/otp/request`. (Ex. ligne `[ConsoleSms] OTP pour +243… : 123456`.)

## 3. Scénario pas-à-pas (mobile + dashboard en parallèle)

### A. Onboarding (mobile)
1. `Phone` → `+243810000099` → recevoir le code (logs backend) → `OTP` → entrer le code.
2. Arrivée sur **Today** : dévotion du jour « When the wait feels long ».

### B. Engagement quotidien
3. Lire la dévotion → « prayed » → **streak** mis à jour (`/users/me/streak`).
4. **Watch** : liste des sermons ; le sermon « Grace, not earned » est **en direct**.
5. **Live** : envoyer un *amen* (1 coin) → **wallet débité** + diffusion temps réel (WS).

### C. Don (parcours clé)
6. **Give** : montant `50` → fonds `General` → méthode `M-Pesa` → confirmer.
7. Provider mock règle immédiatement → écran **succès** (statut `received`).
8. **Dashboard › Giving** (pasteur) : le don apparaît dans les KPIs (MTD, canal M-Pesa).

### D. Communauté & care
9. **Community › Women's Ministry** : lire/envoyer un message (diffusé en direct).
10. **Prayer Wall** : *amen* sur une prière ; **Submit Prayer** en *private*.
11. **Dashboard › Care** (pasteur) : la prière privée est dans la **file** → **Approuver** / **Répondre** → notification envoyée au membre.

### E. Événements & rendez-vous
12. **Events** : RSVP à « Friday prayer night » → compteur incrémenté.
13. **Profile › Book** : sujet `Counseling` → créneau → confirmer (RDV `tentative`).
14. **Dashboard › Care** : le rendez-vous apparaît dans l'agenda.

### F. Vue d'ensemble (dashboard)
15. **Dashboard › Overview** : KPIs en direct (membres, dons MTD, viewers, file de prière, complétion dévotion).

## 4. Points de contrôle (santé démo)

- `curl http://localhost:3333/health` → `{"status":"ok",...}`.
- Swagger : `http://localhost:3333/docs`.
- Collection Postman : [`ipck.postman_collection.json`](./ipck.postman_collection.json).

## 5. Notes

- Aucun secret réel : SMS et paiement sont simulés. Pour brancher Twilio/FlexPay/Stripe, renseigner les variables correspondantes et passer `SMS_PROVIDER`/`PAYMENT_PROVIDER` (voir `.env.example`).
- Les WebSocket (amens/chat) sont sur `ws://<host>:3333/live`.

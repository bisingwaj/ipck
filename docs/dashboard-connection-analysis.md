# Analyse de la connexion dashboard ↔ backend (IPCK House / Admin)

> Source de vérité de la connexion entre `IPCKAdmin/` et l'API NestJS (`backend/`).
> Objet : capter les **points critiques** et tenir une **feuille de route de couverture**
> cohérente avec l'app mobile.
>
> Date d'analyse : 2026-05-31.

---

## 1. Cartographie page ↔ endpoint

| Page (`IPCKAdmin/src/pages/`) | Endpoint(s) consommé(s) | Méthode client | Statut |
| --- | --- | --- | --- |
| `Overview.tsx` | `/admin/overview` | `api.get` | ✅ branché |
| `Care.tsx` | `/prayers/queue`, `/appointments`, `/prayers/:id/status`, `/prayers/:id/respond` | get / patch / post | ✅ branché |
| `Giving.tsx` | `/giving/admin/summary` | `api.get` | ✅ branché |
| `Content.tsx` | `/content/admin`, `/content`, `/content/:id` | get / post / patch / delete | ✅ branché |
| `People.tsx` | `/users`, `/users/new` | `api.get` | 🆕 ajouté |
| `Activity.tsx` | `/admin/activity` | `api.get` | 🆕 ajouté |
| `Login.tsx` | `/auth/otp/request`, `/auth/otp/verify` | `api.post` | ✅ branché |

**Auth** : `AuthContext.tsx` appelle `/auth/me` au démarrage (réhydratation), `/auth/otp/request`,
`/auth/otp/verify`, `/auth/refresh` (rotation) et `/auth/logout` (révocation).

---

## 2. Points critiques

### 🔴 P1 — Session staff sans refresh (corrigé)

**Avant** : `AuthContext` ne stockait que l'`accessToken` (`localStorage['ipck_admin_token']`).
À l'expiration du JWT access, tout `401` éjectait le staff vers `/login` — alors que le backend
expose `POST /auth/refresh` (rotation + révocation, cf. `token.service.ts`).
**Correctif** : persistance du `refreshToken` (`ipck_admin_refresh`) + interceptor `client.ts`
**single-flight** qui, sur `401`, tente un refresh une seule fois (mutex partagé entre requêtes
concurrentes) et rejoue la requête ; ne redirige vers `/login` que si le refresh échoue.
`signOut` révoque le refresh côté backend (`/auth/logout`).

### 🟠 P2 — Couverture partielle des panneaux (en cours)

La Phase 5 du `BACKEND_PLAN` prévoyait 6 panneaux (Overview, Care, Giving, **People**, Content,
**Activity**). **People** et **Activity** manquaient alors que les endpoints existaient déjà
(`/users`, `/users/new`, `/admin/activity`). → **Ajoutés**. Restent non couverts côté UI :

- `/admin/engagement` (métriques d'engagement) — à brancher sur Overview.
- `/admin/content/upcoming` (contenu planifié) — doublonne en partie `Content`.
- Domaines app sans pendant admin : **devotionals** (Today), **groups** (chat), **events** (RSVP),
  **notifications/broadcast**, **giving** détaillé (`/giving/admin/donations`, `/giving/admin/export`),
  monitoring **live** (`/live/current`).

### 🟡 P3 — CORS

`CORS_ORIGINS` (backend Railway) **doit** lister le domaine Vercel exact du dashboard, sinon
échec en `Network Error` silencieux à chaque appel. Cf. `DEPLOY.md` §2.

### 🟢 P4 — RBAC (vérifié OK)

Le dashboard filtre `pastor|admin` à la connexion ; côté backend `AdminController` est gardé
`@Roles('pastor')`. La hiérarchie de `roles.guard.ts` (`member 0 < group_leader 1 < pastor 2 < admin 3`)
fait qu'un **admin satisfait toute exigence `pastor`** → aucun blocage. Pas d'action requise.

### 🟡 P5 — Fallback baseURL en dur

`client.ts` retombe sur `https://ipck-production.up.railway.app/api/v1` si `VITE_API_URL` est absent
au build. Pratique (évite un `Network Error` sur localhost injoignable) mais à garder synchronisé
avec l'URL Railway réelle.

---

## 3. Feuille de route (étapes suivantes, par priorité)

1. **(fait)** Refresh token + retry 401 single-flight.
2. **(fait)** Pages People & Activity.
3. Brancher `/admin/engagement` sur Overview (tuiles secondaires).
4. Page **Giving** enrichie : tableau `/giving/admin/donations` + bouton export `/giving/admin/export`.
5. Page **Content** : intégrer `/admin/content/upcoming` (planning) + monitoring `/live/current`.
6. Panneaux **Community** (groups/events) et **Communications** (`/notifications/broadcast`).
7. Cohérence visuelle : aligner libellés/domaines du dashboard sur ceux de l'app mobile
   (Today/Watch/Give/Community/Profile ↔ panneaux admin).

---

## 4. Cohérence app ↔ dashboard

| Domaine app mobile | Endpoint(s) | Pendant dashboard |
| --- | --- | --- |
| Today (dévotions) | `/devotionals/*`, `/admin/content/upcoming` | ✅ `Devotions` (liste + création + à venir) |
| Watch (sermons/contenus, live) | `/content/*`, `/live/current` | ✅ `Content` (bibliothèque + panneau direct) |
| Give (dons, wallet) | `/giving/admin/summary`, `/giving/admin/donations`, `/giving/admin/export` | ✅ `Giving` (KPIs + ledger + export CSV) |
| Community (groupes, events) | `/groups`, `/events` | ✅ `Community` (groupes + événements + création) |
| Community (prières) | `/prayers/*` | ✅ `Care` (file de prières) |
| Profile (rendez-vous) | `/appointments/*` | ✅ `Care` (rendez-vous) |
| Profile (notifications) | `/notifications/broadcast` | ✅ `Communications` (diffusion push) |
| Overview (engagement) | `/admin/overview`, `/admin/engagement` | ✅ `Overview` (KPIs + engagement) |
| People (membres) | `/users/*` | ✅ `People` |
| Activité transverse | `/admin/activity` | ✅ `Activity` |

Tous les domaines de l'app mobile ont désormais un pendant dans le dashboard.
Endpoints restants non câblés (hors périmètre admin, propres au membre) : chat de
groupe en temps réel (`/groups/:id/messages`), wallet personnel (`/giving/wallet/*`),
flux d'amens live (`/live/:id/amens`).

---

## 5. Principes cardinaux de la logique dashboard

> Objectif : un outil **qui ne ment jamais, ne piège jamais, et guide l'admin pas à pas**.
> Infrastructure partagée : `api/errors.ts`, `auth/permissions.ts`, `components/feedback.tsx`,
> `components/state.tsx`, `api/useAction.ts`.

| # | Principe | Implémentation |
| --- | --- | --- |
| 1 | **Vérité serveur** | Aucun état métier en dur côté front. Après chaque écriture, `useAction.invalidate` re-télécharge l'état réel (pas de présomption optimiste). Le fallback baseURL ne concerne que le transport. |
| 2 | **Cycle d'état explicite** | `QueryBoundary` rend systématiquement `loading → error(+réessayer) → empty → success`. `AuthProvider.ready` empêche le faux écran de login pendant la réhydratation. Validation locale des champs (ex. date d'événement) avant envoi. |
| 3 | **Action = confirmation + blocage + retour** | `useAction` : `confirm()` (modale) avant toute action sensible, `isPending` bloque le double-clic, toast succès/erreur **obligatoire** en sortie. |
| 4 | **Permissions UI = miroir du serveur** | `auth/permissions.ts` réplique la hiérarchie `roles.guard.ts` (member<group_leader<pastor<admin). `can('giving.export')` exige `admin` comme `@Roles('admin')` ; le reste `pastor`. L'UI masque/désactive, **le serveur revérifie toujours** (un 403 retombe en toast). |
| 5 | **Conflits anticipés** | `useAction.onError` détecte `409 / code CONFLICT`, affiche un message dédié (« l'élément a changé, rechargez ») **et réinvalide** les requêtes pour resynchroniser (rollback de l'état affiché). |
| 6 | **Rien de silencieux** | Toasts pour tout succès/erreur ; `FreshnessBadge` signale « Actualisation… » (refetch en cours) et « Données possiblement obsolètes » (refetch en échec) sans masquer la donnée. Les toasts d'erreur ne s'auto-effacent pas. |

Toute nouvelle action d'écriture doit passer par `useAction` ; toute nouvelle vue serveur par
`QueryBoundary` + `FreshnessBadge`. C'est la garantie que les six principes restent tenus.

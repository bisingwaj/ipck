# IPCK House — Admin Dashboard (IBM Carbon)

Refonte complète du Dashboard administrateur d'**IPCK House** en suivant les conventions d'**IBM Carbon Design System** : UI Shell sombre, side nav rail/expandable, type scale productive, tuiles plates sans coins arrondis, tableaux compacts, et — surtout — **une navigation par tabs** au lieu d'un long scroll.

## Comment ouvrir

```bash
cd IPCKHouse-Dashboard
npx serve .          # ou : python3 -m http.server
```

Ouvre ensuite `http://localhost:3000`. (Les scripts JSX exigent un serveur HTTP — `file://` ne marche pas.)

## Ce qui est dans la refonte

### Carbon UI Shell
- **Header** noir 48 px de haut, navigation horizontale, actions à droite (recherche, notifications, aide, app-switcher, avatar)
- **Side nav** 256 px (rail 48 px quand replié via le bouton hamburger), groupée par section (People, Content, Community, Finance, Engagement)
- **Indicateur d'état** « All systems operational » en pied de side-nav

### Page Dashboard à 7 tabs
Au lieu d'empiler 10 sections les unes sous les autres, chaque domaine est un **tab dédié** qui tient sur une vue.

| Tab | Contenu |
|---|---|
| **Overview** | 5 tuiles KPI · « What needs you » (file d'actions priorisée) · Snapshot live + devotional |
| **Live now** | Preview stream · scènes · viewers/géo · push to viewers · chat |
| **Pastoral care** | Bannière de confidentialité · table prières privées + appointments du jour |
| **Giving today** | 4 tuiles KPI · répartition par fonds & canaux · ledger live |
| **People & engagement** | KPI · new members · signaux d'engagement vs target · groupes les plus actifs |
| **Content & schedule** | Devotional du jour · sermon live · calendrier 7 jours |
| **Activity** | Feed temps réel + résumé par type sur 24h |

### Design tokens Carbon
- **Couleurs** : Gray scale 10→100, Blue 60 `#0F62FE` (interactive), Red 60 `#DA1E28`, Green 50, Yellow 30, Purple 60, Magenta 60, Teal 50
- **Espacement** : échelle Carbon `--spacing-01` à `--spacing-13` (2, 4, 8, 12, 16, 24, 32… px)
- **Typographie** : IBM Plex Sans + Mono, classes utilitaires `.t-heading-01..07`, `.t-body-short-01`, `.t-helper-text`…
- **Coins** : 0 px partout (Carbon est sharp)
- **Bordures** : 1 px solid, séparateurs entre tuiles (pas d'ombres)

### Composants réutilisables
- `<CHeader>` / `<CSideNav>` — UI Shell
- `<CTile>` — tuile KPI avec delta, sparkline, caption
- `<CTag>` — pills colorés (info/success/warning/error/live…)
- `<CButton>` — variants : primary, secondary, tertiary, ghost, danger; tailles sm/md/lg
- `<Sparkline>` — micro-graphe avec animation pulse pour le live
- Tables `.cds-data-table` avec densité compacte
- `.cds-notification` — banner avec border-left coloré

## Structure du projet

```
IPCKHouse-Dashboard/
├── index.html
├── README.md
└── src/
    ├── carbon-tokens.css       Variables couleurs / espacements / type scale
    ├── carbon-shell.css        Layout UI shell + composants Carbon
    ├── icons.jsx               Icônes line Carbon (viewBox 32×32)
    ├── data.jsx                Mock data
    ├── shell.jsx               Header + SideNav + primitives (Tile, Tag, Button, Sparkline)
    ├── dashboard.jsx           Conteneur Dashboard + tabs Overview + Live
    └── dashboard-panels.jsx    Tabs Care · Giving · People · Content · Activity
```

## Brancher un backend

Tout le contenu vit dans `src/data.jsx` (`window.DATA`). Remplace les littéraux par des appels API et tous les tabs se mettent à jour.

## Ajouter une page

1. Ajoute un panneau dans `dashboard-panels.jsx` et expose-le sur `window`.
2. Enregistre-le dans le `Panel` map du `Dashboard` (dashboard.jsx).
3. Ajoute une entrée dans `TABS`.

## Différences par rapport à la version précédente

- ❌ Plus de longs scrolls verticaux empilant 10 cards
- ✅ Tabs → chaque domaine tient sur une vue à 1440 × 900
- ❌ Plus de coins arrondis 12–14 px partout
- ✅ Tout en angles droits, à la Carbon
- ❌ Plus de gros gradients décoratifs
- ✅ Surfaces plates, séparateurs nets, hiérarchie par typographie + espacement
- ❌ Plus de cards rounded-12 isolées
- ✅ Grille en tuiles séparées par 1 px de fond gray-30 — pattern Carbon classique
- ✅ Type scale stricte Productive (h1 28/36, h2 16/22, body 14/18, helper 12/16)
- ✅ Boutons toujours `min-width 12rem` quand pas icon-only, label-left + icon-right (Carbon)
- ✅ Side nav avec rail collapse via le hamburger du header

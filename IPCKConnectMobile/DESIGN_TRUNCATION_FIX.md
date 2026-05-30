# DESIGN_TRUNCATION_FIX.md

> **App :** IPCKConnectMobile (React Native `0.76.5` · Expo SDK `~52`)
> **Sujet :** Élimination des troncatures et débordements de titres sur l'ensemble des écrans
> **Statut :** Diagnostic + stratégie + guidelines techniques. ✅ **Étapes 1 → 5 du plan §7 IMPLÉMENTÉES** (voir §8 « État d'implémentation »). Le reste du document conserve l'analyse d'origine ; les snippets restent la référence des patterns appliqués.
> **Police de base :** IBM Plex Sans / Serif (chargement actuellement commenté dans [`fonts.ts`](src/theme/fonts.ts) → fallback System ; voir §5).

---

## 0. Résumé exécutif (TL;DR)

Deux familles de défauts coexistent :

1. **Le wrap incontrôlé des titres d'en-tête** (cause du « Communi / ty » visible sur la capture *Community*). Le titre de page est injecté dans le slot `left` du `TopBar`, lui-même contraint à `flex: 1`. Un mot long en serif 26 px **revient à la ligne au milieu du mot** et chevauche la zone d'action. → **Bug réel observé, priorité 1.**
2. **L'absence quasi-généralisée de `numberOfLines` / `ellipsizeMode`** sur les titres de cartes, lignes de liste et noms d'utilisateurs. ~47 occurrences à risque. Avec des données mockées courtes le rendu est correct, mais dès qu'un titre de sermon, un nom de groupe ou un nom d'utilisateur réel est long (ou que l'utilisateur agrandit la police système), le texte déborde, pousse les icônes hors écran ou casse l'alignement. → **Dette latente, priorité 2.**

La stratégie repose sur **3 patterns normalisés** (`ellipsis 1 ligne`, `clamp multi-lignes`, `font-scaling borné`) + **2 composants partagés à créer** (`<AppText>` et `<TitleRow>`) pour ne plus jamais répéter le problème.

---

## 1. Inventaire des occurrences de troncature

Légende **Risque** : 🔴 confirmé visuellement / structurellement bloquant · 🟠 débordement probable sur texte long ou police agrandie · 🟢 déjà protégé (référence de bonne pratique).

### 1.1 Composants partagés

| # | Fichier · ligne | Élément | Texte (exemple) | Cause probable | Risque |
|---|---|---|---|---|---|
| C1 | [`TopBar.tsx:42`](src/components/TopBar.tsx#L42) | `title` (slot centre) | « Sermon detail » | `numberOfLines={1}` présent ✅ mais `flex: 2` centré entre 2 slots `flex:1` → peu d'espace, ellipsis prématurée | 🟠 |
| C2 | [`TopBar.tsx:33-43`](src/components/TopBar.tsx#L33-L43) + usages `left=` | Titre de page injecté dans `left` | « **Community** » → rendu « Communi / ty » | Le slot `side` est `flex:1, minWidth:60` ; le `<Text>` page-titre (serif **26 px**) n'a **ni `numberOfLines` ni espace suffisant** → wrap mot cassé + chevauchement de l'action droite | 🔴 |
| C3 | [`Pill.tsx:19`](src/components/Pill.tsx#L19) | Contenu de pill | « 612 watching » | Pas de `numberOfLines` ; `alignSelf:'flex-start'` → si label long, la pill peut s'étirer/wrapper | 🟠 |
| C4 | [`Button.tsx:59-61`](src/components/Button.tsx#L59-L61) | Libellé bouton | « Continue » | Pas de `numberOfLines` ; en `flexDirection:row` avec icônes, un libellé long peut pousser les icônes ou wrapper | 🟠 |

### 1.2 Onglet « Today »

| # | Fichier · ligne | Élément | Texte (exemple) | Cause probable | Risque |
|---|---|---|---|---|---|
| T1 | [`TodayHomeScreen.tsx:35`](src/screens/today/TodayHomeScreen.tsx#L35) | Titre bannière live | « Grace, not earned » | Conteneur `flex:1`, **aucun `numberOfLines`** → wrap illimité, pousse le chevron | 🟠 |
| T2 | [`TodayHomeScreen.tsx:48`](src/screens/today/TodayHomeScreen.tsx#L48) | Titre dévotion (serif **26 px**) | « When the wait feels long » | Pas de `numberOfLines` ; sur titre long le bloc grandit sans limite (acceptable ici mais à **clamper**). NB : l'eyebrow « TODAY'S TEACHING » est aussi **chevauché par le `GeoArt`** (marge insuffisante) | 🟠 |
| T3 | [`TodayHomeScreen.tsx:66`](src/screens/today/TodayHomeScreen.tsx#L66) | Titre carte sermon | « … » | Row `[64px icône][flex:1 texte]`, pas de `numberOfLines` | 🟠 |

### 1.3 Onglet « Watch »

| # | Fichier · ligne | Élément | Texte | Cause | Risque |
|---|---|---|---|---|---|
| W1 | [`WatchListScreen.tsx:20`](src/screens/watch/WatchListScreen.tsx#L20) | Titre de page « Watch » (slot `left`) | « Watch » | Même pattern que C2 (court → OK aujourd'hui, fragile) | 🟠 |
| W2 | [`WatchListScreen.tsx:38`](src/screens/watch/WatchListScreen.tsx#L38) | Titre bannière live (serif 20 px) | « Grace, not earned » | Pas de `numberOfLines` | 🟠 |
| W3 | [`WatchListScreen.tsx:65`](src/screens/watch/WatchListScreen.tsx#L65) | Titre ligne sermon (serif 16 px) | titre + bookmark à droite | Row `[64px][flex:1][icône]`, pas de `numberOfLines` | 🟠 |
| W4 | [`SermonDetailScreen.tsx:31`](src/screens/watch/SermonDetailScreen.tsx#L31) | Titre sermon (serif **28 px**) | — | Heading sans clamp | 🟠 |
| W5 | [`LiveScreen.tsx:286`](src/screens/watch/LiveScreen.tsx#L286) | Auteur chat | nom | Row baseline, pas de `numberOfLines` | 🟠 |

### 1.4 Onglet « Community »

| # | Fichier · ligne | Élément | Texte | Cause | Risque |
|---|---|---|---|---|---|
| M1 | [`CommunityHomeScreen.tsx:17`](src/screens/community/CommunityHomeScreen.tsx#L17) | **Titre de page « Community »** (slot `left`, serif 26 px) | « Communi / ty » sur capture | **Bug confirmé** — voir C2 | 🔴 |
| M2 | [`CommunityHomeScreen.tsx:34`](src/screens/community/CommunityHomeScreen.tsx#L34) | Nom de groupe | « Women's Ministry » + badge unread | `flex:1, minWidth:0` ✅ sur le parent mais le `<Text>` n'a pas `numberOfLines` ; le badge en `baseline` réduit la largeur | 🟠 |
| M3 | [`CommunityHomeScreen.tsx:37`](src/screens/community/CommunityHomeScreen.tsx#L37) | Dernier message | « Pastor: Sisters… » | `numberOfLines={1}` ✅ | 🟢 |
| M4 | [`CommunityHomeScreen.tsx:65`](src/screens/community/CommunityHomeScreen.tsx#L65) | Nom d'événement | « Friday prayer night » | Row `[56px date][flex:1]`, pas de `numberOfLines` | 🟠 |
| M5 | [`GroupsListScreen.tsx:34`](src/screens/community/GroupsListScreen.tsx#L34) | Nom de groupe | — | Row `[44px][flex:1][bouton Join]`, pas de `numberOfLines` | 🟠 |
| M6 | [`GroupDetailScreen.tsx:23`](src/screens/community/GroupDetailScreen.tsx#L23) | Nom de groupe (serif 24 px) | — | Heading centré sans clamp | 🟠 |
| M7 | [`GroupChatScreen.tsx:37`](src/screens/community/GroupChatScreen.tsx#L37) | Nom de groupe (header custom) | — | Row `[back][avatar][texte]` sans `numberOfLines` ni `flex` | 🟠 |
| M8 | [`EventsScreen.tsx:22`](src/screens/community/EventsScreen.tsx#L22) | Nom d'événement | — | Row `[64px][flex:1][chevron]` | 🟠 |
| M9 | [`EventDetailScreen.tsx:25`](src/screens/community/EventDetailScreen.tsx#L25) | Titre événement (serif **28 px**) | — | Heading sans clamp | 🟠 |
| M10 | [`PrayerWallScreen.tsx:37`](src/screens/community/PrayerWallScreen.tsx#L37) | Nom du demandeur | + pill ANONYMOUS | Row avec pill droite, pas de `numberOfLines` | 🟠 |
| M11 | [`PrayerDetailScreen.tsx:27,46`](src/screens/community/PrayerDetailScreen.tsx#L27) | Noms (demandeur, auteur réponse) | — | Idem | 🟠 |
| M12 | [`SubmitPrayerScreen.tsx:46`](src/screens/community/SubmitPrayerScreen.tsx#L46) | Libellé d'option | — | Row `[36px][flex:1][check]` | 🟠 |

### 1.5 Onglet « Give » / Wallet

| # | Fichier · ligne | Élément | Cause | Risque |
|---|---|---|---|---|
| G1 | [`GiveHomeScreen.tsx:70`](src/screens/give/GiveHomeScreen.tsx#L70) | « $50 monthly · General fund » | Row flex:1 sans `numberOfLines` | 🟠 |
| G2 | [`GiveFundScreen.tsx:31`](src/screens/give/GiveFundScreen.tsx#L31) | Nom de fonds | Row `[dot][flex:1][check]` | 🟠 |
| G3 | [`GiveHistoryScreen.tsx:28`](src/screens/give/GiveHistoryScreen.tsx#L28) | « fund · method » | Row avec montant+chevron à droite | 🟠 |
| G4 | [`WalletScreen.tsx:31,43`](src/screens/give/WalletScreen.tsx#L31) | Ligne d'équivalence / titre explainer | Pas de `numberOfLines` | 🟠 |
| G5 | [`WalletScreen.tsx:72`](src/screens/give/WalletScreen.tsx#L72) | `rowLabel` | `numberOfLines={1}` ✅ | 🟢 |
| G6 | [`WalletTopupScreen.tsx:69`](src/screens/give/WalletTopupScreen.tsx#L69) | Nom de méthode de paiement | Row `[36px][flex:1][check]` | 🟠 |

### 1.6 Onglet « Profile »

| # | Fichier · ligne | Élément | Cause | Risque |
|---|---|---|---|---|
| P1 | [`ProfileHomeScreen.tsx:45`](src/screens/profile/ProfileHomeScreen.tsx#L45) | Nom utilisateur (serif 22 px) | Row `[72px avatar][flex:1][bouton Edit]` sans `numberOfLines` | 🟠 |
| P2 | [`ProfileHomeScreen.tsx:65`](src/screens/profile/ProfileHomeScreen.tsx#L65) | Titre de réglage | Row `[36px][flex:1, minWidth:0][toggle]` sans `numberOfLines` sur le titre | 🟠 |
| P3 | [`ProfileHomeScreen.tsx:66`](src/screens/profile/ProfileHomeScreen.tsx#L66) | Sous-titre réglage | `numberOfLines={1}` ✅ | 🟢 |
| P4 | [`NotificationsScreen.tsx:27`](src/screens/profile/NotificationsScreen.tsx#L27) | Titre notification | Row baseline + heure + dot, pas de `numberOfLines` | 🟠 |
| P5 | [`NotificationsScreen.tsx:30`](src/screens/profile/NotificationsScreen.tsx#L30) | Sous-titre notif | `numberOfLines={1}` ✅ | 🟢 |
| P6 | [`ServiceTimesScreen.tsx:23`](src/screens/profile/ServiceTimesScreen.tsx#L23) | Nom de service (serif 18 px) | Row `[96px heure][flex:1]` | 🟠 |
| P7 | [`MyAppointmentsScreen.tsx:17`](src/screens/profile/MyAppointmentsScreen.tsx#L17) | Titre RDV (serif 20 px) | Sans clamp | 🟠 |
| P8 | [`BookTopicScreen.tsx:38`](src/screens/profile/BookTopicScreen.tsx#L38) | Titre de sujet | Row `[radio][flex:1]` | 🟠 |

**Bilan chiffré** : ~47 `<Text>` titres/headings à risque · 5 déjà protégés (`numberOfLines={1}`) · **1 bug confirmé visuellement** (C2/M1) · 0 largeur fixe en pixels enveloppant du texte (les layouts utilisent `flex` — bonne base).

---

## 2. Analyse des causes et classification

### Pattern A — **En-tête / titre de page qui wrappe ou se chevauche** 🔴 (le bug visible)
- **Où :** `TopBar` quand un titre de page est passé via `left=` (Community 26 px, Watch, Give…), et le slot centre `title` (C1).
- **Mécanique :** `styles.side = { flex: 1, minWidth: 60 }` et `styles.title = { flex: 2, textAlign:'center' }`. Le titre de page n'est **pas** le `title` du TopBar : c'est un `<Text>` brut dans `left`. Il hérite donc de `flex:1` (≈ ⅓ de la largeur) ⇒ un mot de 9 lettres en serif 26 px **ne tient pas et wrappe au milieu** (`Communi / ty`), puis chevauche l'icône `search`.
- **Cause racine :** confusion entre « titre de page éditorial » (gros, aligné à gauche) et « titre de barre » (petit, centré, tronqué). Le `TopBar` n'a pas de variante pour le premier cas.

### Pattern B — **Conteneur ligne `row` sans garde-fou sur le texte** 🟠 (le plus fréquent)
- **Où :** toutes les lignes de liste `[icône/date/avatar fixe] [texte flex:1] [icône/badge/bouton]` (M2, M4, M5, M8, W3, P1, P2, G2, G6…).
- **Mécanique :** le parent a bien `flex:1`, mais **le `<Text>` n'a pas `numberOfLines`**. RN laisse alors le texte wrapper sur N lignes (désaligne la ligne) ou, si un frère a une largeur intrinsèque (badge, bouton « Join »), le calcul de largeur peut **rogner / pousser** les éléments. Manque aussi `minWidth:0` sur certains parents (sur Android, un enfant `row` peut refuser de rétrécir sans lui).
- **Cause racine :** absence de convention partagée → chaque écran réimplémente la row à la main.

### Pattern C — **Heading éditorial sans clamp** 🟠
- **Où :** titres serif 20–28 px (W4, M6, M9, P7, T2…).
- **Mécanique :** pas de troncature horizontale, mais un titre long s'étend sur 4-5 lignes, pousse le contenu sous la ligne de flottaison et déséquilibre la composition. Acceptable jusqu'à une limite — qui n'est aujourd'hui pas fixée.

### Pattern D — **Aucune maîtrise du Dynamic Type** 🟠 (transversal)
- **Où :** **tout le code.** Aucun `maxFontSizeMultiplier` ni `allowFontScaling` n'est utilisé.
- **Mécanique :** un utilisateur Android/iOS avec « grande police » système voit chaque taille multipliée (×1.3 à ×2). Les titres déjà serrés (TopBar, rows) **débordent systématiquement**. C'est le multiplicateur de gravité de tous les autres patterns.

### Pattern E — **Pas de largeur fixe problématique** ✅
- Vérifié : aucune `width: <px>` n'enveloppe un titre. Les blocs largeur fixe sont des conteneurs d'icônes/dates (`64×64`, `56×56`…) — corrects.

---

## 3. Stratégie de design

### 3.1 Principe directeur : 3 comportements normalisés

| Pattern | Quand l'utiliser | Comportement | Accès au texte complet |
|---|---|---|---|
| **① Ellipsis 1 ligne** | Métadonnées, libellés secondaires, lignes denses où l'alignement prime (sous-titres, « fund · method », auteurs) | `numberOfLines={1}` + `ellipsizeMode="tail"` | L'écran de détail montre le texte entier (déjà le cas) |
| **② Clamp multi-lignes** | **Titres** de cartes, de lignes, d'événements, de groupes, headings éditoriaux | `numberOfLines={2}` (rows) ou `{3}` (headings) + `ellipsizeMode="tail"` | Tap sur la carte/ligne → détail. Pour les headings d'écran de détail : **pas de clamp** (texte intégral). |
| **③ Font-scaling borné** | En-têtes de page critiques qui **doivent** rester entiers (TopBar, titre de page) | `numberOfLines={1}` + `adjustsFontSizeToFit` (iOS, réduit la taille) **ou** réduction de la taille de base + `maxFontSizeMultiplier` | Toujours visible (réduit plutôt que coupé) |

**Règle de priorité — qu'est-ce qu'on sacrifie, et dans quel ordre :**
1. On préserve **la lisibilité du titre** avant tout (jamais coupé sans accès au complet).
2. On sacrifie d'abord **la densité** (on autorise 2-3 lignes) ;
3. puis **l'uniformité de taille** (font-scaling/`adjustsFontSizeToFit`) **uniquement sur les en-têtes** ;
4. en dernier recours seulement, **l'ellipsis** (perte d'info), et toujours avec un chemin vers le texte complet (détail/tap).
   → On **ne sacrifie jamais** l'alignement vertical des lignes de liste (d'où le clamp plutôt que le wrap libre).

### 3.2 Règles par type de composant

**Titre de carte (sermon, dévotion, prière — ex. T2, T3, W2, W4)**
- Cartes « hero » (dévotion, bannière live) : `numberOfLines={2}`, `ellipsizeMode="tail"`. Le sous-titre/verset reste en dessous.
- Heading d'écran de détail (`SermonDetail`, `EventDetail`) : **pas de troncature**, wrap libre (l'utilisateur est venu lire ce titre). On garde simplement `maxFontSizeMultiplier={1.3}` pour éviter l'explosion sur grande police.

**Titre de liste (groupes, événements, fonds, prières — Pattern B)**
- Titre : `numberOfLines={1}` (ou `{2}` si le design l'autorise) + `ellipsizeMode="tail"`.
- Sous-titre : `numberOfLines={1}` (déjà fait par endroits).
- **Conteneur** : parent texte en `{ flex: 1, minWidth: 0 }` ; éléments de droite (badge, bouton, chevron) en `flexShrink: 0`.
- Badge unread / pill à droite du titre : ne doit pas être dans le flux qui rogne le titre → mettre le titre en `flex:1` et le badge en `flexShrink:0`.

**En-tête d'écran (TopBar — Pattern A, priorité 1)**
- **Doit impérativement rester entier.** Créer une variante `titleLarge` (ou un composant `PageHeader`) pour les titres de page éditoriaux, séparée du `title` centré tronquable.
- Le titre de page (gros, aligné à gauche) sort du système `flex:1/flex:2` : il occupe toute la largeur disponible et passe sur 2 lignes au besoin **sans casser un mot** (RN ne coupe pas les mots par défaut — le « Communi/ty » vient de l'espace insuffisant, pas d'un `wordBreak`). Le fixer = lui donner la largeur.
- Pour le `title` centré classique : conserver `numberOfLines={1}` + envisager `adjustsFontSizeToFit` si des titres longs sont attendus.

**Modales & bottom sheets (`ModalTitle`)**
- Titre + bouton fermeture (✕) sur une row : titre en `flex:1`, `numberOfLines={2}`, `ellipsizeMode="tail"` ; bouton fermeture `flexShrink:0`, taille de hit ≥ 44×44.

---

## 4. Recommandations techniques (guidelines développeurs)

### 4.1 Correctif prioritaire (Pattern A — bug « Community »)

**Option recommandée : ajouter une variante `titleLarge` au `TopBar`** (réutilisable sur Community/Watch/Give/Profile).

Dans [`TopBar.tsx`](src/components/TopBar.tsx), ajouter une prop et un rendu dédié :

```tsx
interface Props {
  title?: string;
  titleLarge?: string;   // ← NOUVEAU : titre de page éditorial, pleine largeur
  // …reste inchangé
}

// dans le JSX, remplacer le bloc title :
{titleLarge ? (
  <Text
    style={styles.titleLarge}
    numberOfLines={1}
    adjustsFontSizeToFit          // iOS : réduit avant de tronquer
    minimumFontScale={0.85}
    maxFontSizeMultiplier={1.3}
  >
    {titleLarge}
  </Text>
) : title ? (
  <Text numberOfLines={1} style={styles.title} maxFontSizeMultiplier={1.3}>{title}</Text>
) : <View style={{ flex: 1 }} />}

// styles :
titleLarge: {
  fontFamily: fonts.serifBold, fontSize: 26, color: tokens.editorialInk,
  letterSpacing: -0.4, flex: 1,            // ← prend toute la largeur dispo
},
```

Puis dans [`CommunityHomeScreen.tsx:16-19`](src/screens/community/CommunityHomeScreen.tsx#L16-L19) :

```tsx
// AVANT
<TopBar left={<Text style={styles.pageTitle}>Community</Text>} actions={[{ icon: 'search', onPress: () => {} }]} />
// APRÈS
<TopBar titleLarge="Community" actions={[{ icon: 'search', onPress: () => {} }]} />
```

Appliquer le même remplacement à `WatchListScreen` (« Watch »), `GiveHomeScreen`, `ProfileHomeScreen`, etc. (supprimer le `styles.pageTitle` local devenu inutile).

> **Alternative minimale sans toucher au TopBar** (si refonte non souhaitée tout de suite) : laisser le titre dans `left` mais lui retirer la contrainte de slot en l'enveloppant pleine largeur et en bornant la police :
> ```tsx
> left={<Text style={styles.pageTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.9} maxFontSizeMultiplier={1.3}>Community</Text>}
> ```
> ⚠️ Cette alternative reste limitée par `flex:1` du slot `side` — `adjustsFontSizeToFit` évitera la coupure de mot mais réduira la police. La variante `titleLarge` est préférable.

### 4.2 Composant texte partagé `<AppText>` (Pattern D — bornage global)

Créer `src/components/AppText.tsx`. Il borne le font-scaling **partout** et expose des helpers de troncature, pour ne plus jamais oublier `numberOfLines`.

```tsx
import React from 'react';
import { Text, TextProps, StyleProp, TextStyle } from 'react-native';

type Clamp = 1 | 2 | 3 | 'none';

interface AppTextProps extends TextProps {
  clamp?: Clamp;                 // raccourci numberOfLines + ellipsize
  style?: StyleProp<TextStyle>;
}

export function AppText({ clamp = 'none', maxFontSizeMultiplier = 1.4, ...rest }: AppTextProps) {
  const truncation =
    clamp === 'none' ? {} : { numberOfLines: clamp, ellipsizeMode: 'tail' as const };
  return <Text maxFontSizeMultiplier={maxFontSizeMultiplier} {...truncation} {...rest} />;
}
```

Usage : `<AppText clamp={1} style={styles.rowTitle}>{title}</AppText>`. Migration progressive — `<Text>` reste valide.

### 4.3 Composant `<TitleRow>` (Pattern B — lignes de liste)

Encapsule la structure `[leading] [titre+sous-titre flex:1] [trailing]` correcte une fois pour toutes :

```tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from './AppText';

export function TitleRow({ leading, title, subtitle, trailing }: {
  leading?: React.ReactNode; title: string; subtitle?: string; trailing?: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      {leading}
      <View style={styles.mid}>
        <AppText clamp={1} style={styles.title}>{title}</AppText>
        {!!subtitle && <AppText clamp={1} style={styles.sub}>{subtitle}</AppText>}
      </View>
      {trailing && <View style={styles.trailing}>{trailing}</View>}
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  mid: { flex: 1, minWidth: 0 },            // minWidth:0 = clé pour Android
  trailing: { flexShrink: 0 },              // l'action ne rogne jamais le titre
  /* title/sub : reprendre les styles existants de chaque écran */
});
```

### 4.4 Snippets ciblés par pattern (à appliquer si on ne migre pas vers les composants ci-dessus)

**① Ligne de liste — ajout minimal** (ex. [`CommunityHomeScreen.tsx:34`](src/screens/community/CommunityHomeScreen.tsx#L34)) :
```tsx
// AVANT
<Text style={styles.groupName}>{g.name}</Text>
// APRÈS
<Text style={styles.groupName} numberOfLines={1} ellipsizeMode="tail" maxFontSizeMultiplier={1.3}>{g.name}</Text>
```
+ s'assurer que le badge est non-rognant :
```tsx
{g.unread > 0 && <View style={[styles.unreadDot, { flexShrink: 0 }]}><Text …>{g.unread}</Text></View>}
```

**② Heading de carte** (ex. [`TodayHomeScreen.tsx:48`](src/screens/today/TodayHomeScreen.tsx#L48)) :
```tsx
<Text style={styles.devTitle} numberOfLines={2} ellipsizeMode="tail" maxFontSizeMultiplier={1.3}>
  {todayDevotional.title}
</Text>
```
+ corriger le chevauchement de l'eyebrow par le `GeoArt` : augmenter `marginTop` du bloc texte (ligne 46) de `90` → `104`, ou réduire `GeoArt height` à `110`.

**③ Heading d'écran de détail** (ex. [`SermonDetailScreen.tsx:31`](src/screens/watch/SermonDetailScreen.tsx#L31)) — **wrap libre, juste borner la police** :
```tsx
<Text style={styles.title} maxFontSizeMultiplier={1.3}>{sermon.title}</Text>
```

**④ Accès au titre complet quand on tronque sans détail** (cas rares, ex. pill, header chat) — tap → `Alert` ou tooltip :
```tsx
import { Alert } from 'react-native';
<Pressable onPress={() => Alert.alert(group.name)}>
  <Text style={styles.headTitle} numberOfLines={1} ellipsizeMode="tail">{group.name}</Text>
</Pressable>
```

**⑤ Composant `Pill`** ([`Pill.tsx:19`](src/components/Pill.tsx#L19)) :
```tsx
<Text style={[styles.txt, { color: palette.fg }]} numberOfLines={1} maxFontSizeMultiplier={1.2}>{children}</Text>
```

**⑥ Composant `Button`** ([`Button.tsx:59`](src/components/Button.tsx#L59)) :
```tsx
<Text numberOfLines={1} ellipsizeMode="tail" maxFontSizeMultiplier={1.3} style={{ fontFamily: fonts.uiBold, fontSize: sizing.fz, color: palette.fg, flexShrink: 1 }}>
  {children}
</Text>
```

### 4.5 Bonnes pratiques de style (à ajouter au guide d'équipe)
- **Jamais de `width: <px>` autour d'un texte.** Utiliser `flex`, `%`, `maxWidth`. (Déjà respecté — à maintenir.)
- Tout parent de texte dans une row : `{ flex: 1, minWidth: 0 }`. Tout frère d'action : `flexShrink: 0`.
- `ellipsizeMode="tail"` par défaut (jamais `"clip"` qui coupe net).
- Pas de librairie nécessaire : `numberOfLines`, `ellipsizeMode`, `adjustsFontSizeToFit`, `maxFontSizeMultiplier` sont **natifs RN 0.76 / Expo 52**. Pour des tooltips riches, `Alert` natif suffit ; si un vrai tooltip est voulu plus tard, `@rn-primitives/tooltip` ou un bottom-sheet (`@gorhom/bottom-sheet`, déjà compatible Expo 52) plutôt que des libs abandonnées.

### 4.6 Langues & polices système agrandies
- IBM Plex n'est pas encore chargé ([`fonts.ts`](src/theme/fonts.ts) → tout est commenté, fallback System). Les métriques System (Roboto/SF) **diffèrent** d'IBM Plex : tester la troncature **avec les vraies polices une fois activées**, car la largeur des glyphes changera.
- Prévoir une marge de sécurité : un libellé FR/anglais long (« Membership class » → « Cours d'adhésion des membres ») doit déjà rentrer dans le design en mock.
- `maxFontSizeMultiplier` recommandé : **1.3** pour titres/headings, **1.4** pour le corps, **1.2** pour pills/badges. Ne jamais mettre `allowFontScaling={false}` sur du contenu lisible (anti-accessibilité) — le réserver aux mono/numériques décoratifs si besoin.

---

## 5. Considérations d'accessibilité

- **Plancher de lisibilité :** ne pas descendre sous **11 px** effectifs. Avec `adjustsFontSizeToFit`, fixer `minimumFontScale` (ex. `0.85`) pour ne pas réduire un titre 26 px en dessous de ~22 px.
- **Accès garanti au texte complet :** toute troncature doit avoir un chemin vers l'intégral (tap → détail/`Alert`). Critère non négociable (cf. §3.1 règle 1).
- **Respect du Dynamic Type :** garder `allowFontScaling` actif (défaut) + borner par `maxFontSizeMultiplier`. C'est le compromis entre « respecter la préférence système » et « ne pas casser la mise en page ».
- **Cibles tactiles :** boutons de fermeture/actions à droite d'un titre ≥ 44×44 (`hitSlop` déjà utilisé dans `TopBar` ✅).
- **Contraste :** vérifier `textTertiary (#9CA4B3)` sur `bg (#F7F5F0)` ≈ ratio 2.4:1 → **insuffisant (< 4.5:1)** pour du texte normal ; à réserver aux éléments décoratifs/désactivés, pas aux titres.
- **`accessibilityLabel` :** sur un titre tronqué, fournir le label complet pour les lecteurs d'écran : `accessibilityLabel={fullTitle}`.

---

## 6. Plan de validation

### 6.1 Jeux de données de test (à injecter dans [`mock.ts`](src/data/mock.ts) en dev)
- **Titre court** : « Grace » · **moyen** : « When the wait feels long » · **très long** : « When the wait feels long and the silence of God tests the patience of every believer in the congregation ».
- **Nom mono-mot long** : « Wonderworking » / « Communauté » · **nom à 2 mots** : « Women's Ministry ».
- **Texte vide / null** : vérifier qu'aucune ligne ne casse (fallback `—`).

### 6.2 Matrice d'appareils & réglages
| Axe | Valeurs à tester |
|---|---|
| Plateforme | iOS (simulateur) + Android (émulateur) |
| Largeur écran | petit (iPhone SE / Android 360 dp) + grand (Pixel 7 Pro) |
| Police système | Standard · Large · **XXL/Accessibility** (Réglages → Affichage → Taille du texte) |
| Police app | System (actuel) **et** IBM Plex une fois activée |
| Langue | EN + FR (libellés plus longs) |

### 6.3 Scénarios visuels (checklist QA)
1. Écran **Community** : titre « Community » sur **une seule ligne**, sans chevauchement du `search`. (régression du bug 🔴)
2. Liste de groupes/événements/fonds : titres sur 1 ligne avec ellipsis, **icônes/badges jamais poussés hors écran**, lignes **alignées**.
3. Cartes Today/Watch : titres clampés à 2 lignes, sous-titres visibles, eyebrow non chevauché par `GeoArt`.
4. Écrans de détail (Sermon/Event) : titre **entier** (wrap), pas de coupure.
5. Police système **XXL** : aucun titre coupé sans accès au complet ; en-têtes réduits proprement, pas de débordement hors carte.
6. Boutons et pills : libellés sur 1 ligne, pas de wrap.

### 6.4 Critères de succès
- ✅ Aucun titre coupé **sans** moyen d'accéder au texte complet.
- ✅ Aucun mot cassé en milieu de mot dans un en-tête (régression « Communi/ty »).
- ✅ Aucun élément d'action (icône, badge, bouton) poussé hors de l'écran par un texte.
- ✅ Lignes de liste alignées quelle que soit la longueur du titre.
- ✅ Rendu stable de la police Standard à XXL (avec réduction maîtrisée, jamais < plancher de lisibilité).
- ✅ Équilibre visuel conservé (densité, hiérarchie serif/sans inchangée).

---

## 7. Plan d'action recommandé (ordre de mise en œuvre)

| Étape | Action | Effort | Impact | Statut |
|---|---|---|---|---|
| 1 | Corriger le `TopBar` (`titleLarge`) + migrer les titres de page → fixe le bug 🔴 visible | S | Élevé | ✅ Fait |
| 2 | Créer `<AppText>` (bornage `maxFontSizeMultiplier` global) | S | Élevé (Pattern D) | ✅ Fait |
| 3 | Ajouter `numberOfLines`/`ellipsizeMode` sur les ~47 titres 🟠 (ou migrer vers `<TitleRow>`) | M | Élevé (Pattern B/C) | ✅ Fait |
| 4 | Patcher `Pill` et `Button` | XS | Moyen | ✅ Fait |
| 5 | Corriger chevauchement eyebrow/`GeoArt` (Today) | XS | Moyen | ✅ Fait |
| 6 | Ajouter jeux de test longs dans `mock.ts` + passer la checklist QA §6 | M | Validation | ⏳ QA manuelle (émulateur) |

---

## 8. État d'implémentation (mise à jour)

Toutes les modifications de code ci-dessous ont été appliquées et **`npx tsc --noEmit` passe sans erreur**. Validation visuelle Community confirmée par l'utilisateur ; le reste reste à valider sur émulateur (étape 6 / §6).

### Nouveaux fichiers

- [`src/theme/textScaling.ts`](src/theme/textScaling.ts) — borne globale `maxFontSizeMultiplier = 1.4` sur tous les `Text`/`TextInput` (importé en tête de [`App.tsx`](App.tsx)). **Pattern D résolu globalement.**
- [`src/components/AppText.tsx`](src/components/AppText.tsx) — primitive `<AppText clamp={1|2|3}>` (numberOfLines + ellipsize + cap), exportée.
- [`src/components/TitleRow.tsx`](src/components/TitleRow.tsx) — layout de ligne canonique `[leading][titre flex:1 minWidth:0][trailing flexShrink:0]`, exporté (dispo pour futures lignes).

### `TopBar` — variante `titleLarge` (Pattern A 🔴)

- [`src/components/TopBar.tsx`](src/components/TopBar.tsx) : nouvelle prop `titleLarge` (titre éditorial pleine largeur, aligné à gauche, `numberOfLines={1}` + `adjustsFontSizeToFit` + `minimumFontScale={0.85}`), refactor `backOrLeft`/`rightContent`, `maxFontSizeMultiplier={1.3}` sur le `title` centré.
- Migrés vers `titleLarge` (et `styles.pageTitle` mort supprimé) : `CommunityHomeScreen`, `WatchListScreen`, `GiveHomeScreen`, `ProfileHomeScreen`.

### Titres clampés (Pattern B/C — `numberOfLines` + `ellipsizeMode="tail"`)

`Today`: live banner (2), devTitle (3), card sermon (2). `Watch`: live banner (2), row sermon (2). `Community`: groupName (1, + `flexShrink`/badge `flexShrink:0`), eventName, prayer card, GroupsList, Events (2), GroupDetail (2, centré), **GroupChat** (header `back` redondant retiré pour afficher l'en-tête prévu + nom tronqué), PrayerWall/PrayerDetail (who/replyWho), SubmitPrayer. `Give`: recurring, GiveFund, GiveHistory, WalletTopup (method), Wallet (heroEq, explainer). `Profile`: name, settings row, Notifications (title), ServiceTimes, BookTopic, MyAppointments. `Live`: chatWho (+ `flexShrink:1`). `SermonDetail`: notesH.
- **Headings d'écran de détail** (`SermonDetail.title`, `EventDetail.title`) : laissés en **wrap libre** (stratégie §3.2) — scaling déjà borné globalement.

### Composants (Étape 4)

- [`Pill.tsx`](src/components/Pill.tsx) : `numberOfLines={1}` + ellipsize.
- [`Button.tsx`](src/components/Button.tsx) : libellé `numberOfLines={1}` + ellipsize + `flexShrink:1`.

### Eyebrow / GeoArt (Étape 5)

- [`TodayHomeScreen.tsx`](src/screens/today/TodayHomeScreen.tsx) : `marginTop` du bloc contenu `90 → 108` (eyebrow « TODAY'S TEACHING » dégagé sous l'art).

### Reste à faire (Étape 6 — hors code)

- Jeux de test longs : **non injectés** dans `mock.ts` pour ne pas dégrader l'affichage réel ; à faire en local/temporairement pendant la QA.
- Passer la **checklist QA §6.3** sur émulateurs iOS/Android avec police système **XXL** + langue FR.

# Big Bang Clicker - Architecture technique

> Traduction technique des décisions de conception. Principe central :
> **data-driven** (le moteur est générique ; ères, ressources, recettes,
> usines, upgrades et crises sont des données). Voir
> [GAME-DESIGN.md](./GAME-DESIGN.md), [PHASES.md](./PHASES.md),
> [UI-UX.md](./UI-UX.md), [AGENTS.md](../AGENTS.md).
>
> Les extraits de types ci-dessous sont **indicatifs** (intentions de
> structure), pas le code final.

## 1. Principes

- **Data-driven** : aucune ère n'est codée en dur. Le moteur lit des
  **définitions** (statiques, dans `src/data/`) et fait évoluer un **état**
  (runtime, sérialisé). Ajouter une ère **générique** = données + i18n. Une ère
  dotée d'un **widget interactif** (mécanique propre, ex : tableau périodique)
  demande en plus un composant widget (voir section 11) : exception assumée.
- **Séparation définitions / état** : les définitions (`*Def`) ne sont **jamais
  sérialisées** ; seul l'état runtime l'est (niveaux, quantités, drapeaux). Les
  sauvegardes restent petites et le contenu peut évoluer sans casser les saves.
- **Logique pure dans `src/lib/`** : le moteur (tick, coûts, conversions,
  prestige, crises) est testable sans React.
- **Stores Zustand fins** : un store par domaine ; sélecteurs précis pour
  limiter les re-renders.
- **Front-end pur** : tout en local (localStorage), aucun serveur.

## 2. Arborescence

Voir aussi [AGENTS.md](../AGENTS.md). Détail data-driven :

```
src/
├── lib/                  # logique pure (zéro React, testée)
│   ├── types.ts          # types du domaine (Def + State)
│   ├── engine.ts         # tick, coûts (arrondis), achats, conversion manuelle, multiplicateurs de galets, clickYield, palier
│   ├── graph.ts          # flux nets réels + alertes (déclin / production à zéro), dépendances, tri
│   ├── reveal.ts         # dévoilement progressif (machines / ressources)
│   ├── events.ts         # évènements narratifs déclenchés (transitions, crises, tuto)
│   ├── crises.ts         # risque, déclenchement, effets
│   ├── prestige.ts       # Échos, reset New Game+
│   ├── meta.ts           # méta-upgrades de prestige
│   ├── save.ts           # état initial, sérialisation versionnée + migrations, idle, export/import
│   ├── format.ts         # notation abrégée des grands nombres
│   └── galets.ts         # galets de l'infini : découverte + galets affectant une machine
├── data/
│   ├── eras/             # toutes les ères via factory.ts (buildEra) : cosmos (e0-4), life, civilization, space, transcendence
│   ├── crises.ts         # définitions de crises
│   ├── metaUpgrades.ts   # définitions des méta-upgrades
│   ├── galets.ts         # définitions des galets de l'infini
│   └── index.ts          # agrégation typée (defs)
├── store/                # stores Zustand (gameStore persisté ; les autres transitoires)
│   ├── gameStore.ts      # état de jeu + actions + persistance
│   ├── feedbackStore.ts  # nombres flottants transitoires (+X / -X)
│   ├── clickPulse.ts     # signal générique "verbe activé" (widgets passifs, ex. jauge)
│   └── eventStore.ts     # file des modales d'évènements
├── i18n/                 # i18n custom (voir section 10)
├── hooks/
│   ├── useTick.ts        # boucle de jeu + autosauvegarde (+ sauvegarde à la fermeture)
│   ├── useEvents.ts      # détecte et enfile les évènements narratifs
│   ├── useGalets.ts      # découverte des galets au franchissement de palier
│   └── useEraMechanic.ts # geste de clic d'une ère (gain de base + complétion gratuite)
├── components/
│   ├── ui/               # primitives (Button, Panel, Icon, IconBadge, AlertBadge, FloaterLayer...)
│   ├── game/             # ressources, machines, paliers, badges, bannières, galets, EventModal
│   │   └── widgets/      # widgets d'ère : passifs (CoolingWidget...) + 10+ interactifs (BohrAtom, StarNursery, PeriodicTable, AccretionDisk, PetriDish...) routés par interactive.ts ; helper svgCoords.ts
│   └── layout/           # coquille, navigation d'ères, SceneBackground, GaletReceptacle
└── App.tsx               # navigation par état (pas de router)
```

Hors `src/`, le dossier `sim/` héberge un harnais de simulation d'équilibrage
(profils de joueur, boucle headless, visualiseur), exclu de `make check` et
lancé via `make sim` / `make sim-view`.

## 3. Modèle de données (définitions statiques)

```ts
type ResourceId = string
type EraId = string

type UiTier = 'cosmos' | 'life' | 'civilization' | 'space' | 'transcendence'

interface ResourceDef {
  id: ResourceId
  eraId: EraId
  nameKey: string        // clé i18n
  icon: string           // identifiant d'icône
  symbol?: string        // symbole chimique (atomes) affiché à la place de l'icône
  tier: number           // profondeur dans le graphe -> récompense en Complexité
  isBase?: boolean       // productible directement (pas seulement via recette)
}

// Coût géométrique : base * growth^level (possiblement multi-ressources)
interface CostCurve {
  resource: ResourceId
  base: number
  growth: number         // ex : 1.07 à 1.15
}

// "Usine" produisant une ressource de base (générateur)
interface GeneratorDef {
  id: string
  eraId: EraId
  output: ResourceId
  baseRate: number       // unités/s par niveau
  cost: CostCurve[]
}

// Recette (convertisseur) : entrées -> sorties. Toute recette est à la fois
// déclenchable à la main (manualConvert : 1 clic = 1 recette) ET automatisable
// en achetant des niveaux (elle tourne alors au tick). Pas de flag "manual".
interface ConverterDef {
  id: string
  eraId: EraId
  inputs: { resource: ResourceId; amount: number }[]
  outputs: { resource: ResourceId; amount: number }[]
  baseRate: number       // cycles/s par niveau
  cost: CostCurve[]
}

interface Effect {
  type: 'multiplier' | 'unlock' | 'transformResource' | 'grantResource'
        | 'resetResource' | 'resetGenerator' | 'flatBonus'
  target?: string        // id de ressource / usine / upgrade visé
  value?: number
}

interface UpgradeDef {
  id: string
  eraId: EraId
  cost: { resource: ResourceId; amount: number }[]
  requires?: string[]
  effects: Effect[]
  nameKey: string
  descKey: string
}

interface CrisisDef {
  id: string
  eraId: EraId
  // montée du risque : télégraphiée, souvent liée à une sur-exploitation
  risk: { sourceResource?: ResourceId; threshold: number; telegraph: boolean }
  trigger: 'threshold' | 'player' | 'probabilistic'
  regression: Effect[]   // pertes partielles (resetResource, resetGenerator...)
  rebound: Effect[]      // gains permanents / transformations (transformResource...)
  textKeys: { warnKey: string; triggerKey: string; reboundKey: string }
}

interface EraDef {
  id: EraId
  index: number          // 0..19
  nameKey: string
  uiTier: UiTier
  widget: string         // id du widget iconique (voir UI-UX.md)
  unlock: { resource?: ResourceId; amount?: number; complexity?: number }
  resources: ResourceId[]
  generators: string[]
  converters: string[]
  upgrades: string[]
  crises: string[]
}
```

## 4. État runtime (sérialisé)

```ts
interface GameState {
  version: number              // pour les migrations
  startedAt: number
  lastSeen: number             // pour l'idle hors-ligne
  currentEraId: EraId          // ère active (focus)
  unlockedEras: EraId[]        // cohabitation
  resources: Record<ResourceId, number>
  generators: Record<string, { level: number }>
  converters: Record<string, { level: number; enabled: boolean }>
  upgrades: Record<string, boolean>
  crises: Record<string, { risk: number; resolved: boolean; count: number }>
  multipliers: Record<string, number>  // par ressource + clés 'global' et 'meta'
  complexity: number           // méta-ressource (plafonnée au prochain palier)
  echoes: number               // monnaie de prestige
  metaUpgrades: Record<string, boolean>
  totalComplexityEver: number  // base du calcul de prestige
  discovered: Record<ResourceId, boolean>  // ressources déjà produites (dévoilement collant)
  seenEvents: Record<string, boolean>      // modales narratives déjà montrées (une fois)
  galets: Record<string, { found: boolean; active: boolean }>  // galets de l'infini (conservés au prestige)
}
```

Règle : tout ce qui dépend du **contenu** (noms, taux, coûts) vit dans les
`*Def`, pas dans `GameState`. À la sauvegarde, on ne stocke que `GameState`.

## 5. Moteur (tick)

Cœur du jeu : une fonction **pure** qui avance l'état d'un pas de temps.

```ts
function tick(state: GameState, defs: GameDefs, dt: number): GameState
```

Étapes d'un tick :

1. **Production des générateurs** : pour chaque générateur, `output +=
   level * baseRate * multiplicateurs * dt`.
2. **Conversions (usines)** : pour chaque convertisseur actif, calculer le
   nombre de cycles réalisables sur `dt` **limité par les entrées
   disponibles**. Consommer les entrées, produire les sorties.
   - **Pas de blocage dur** (règle GAME-DESIGN 3.1ter) : la consommation est
     clampée aux stocks disponibles ; les ressources de base gardent une
     production minimale.
3. **Complexité** : chaque conversion crédite de la Complexité, **pondérée par
   le `tier`** de la sortie (plus c'est profond, plus ça rapporte) ET
   **décroissante avec l'ancienneté de l'ère** (`COMPLEXITY_ERA_DECAY = 50` :
   une ère antérieure rapporte ÷50, ÷2500 deux ères plus tôt...), puis
   **plafonnée au coût du prochain palier** (pas de dépassement passif). La
   Complexité ne **recule que sur les crises**.
4. **Risque des crises** : mis à jour par `updateRisk` (composé avec `tick`
   dans le store), voir section 7.

Hors `tick` (actions, dans le store / le moteur) :

- **Conversion manuelle** (`manualConvert`) : applique une recette d'un clic
  (consomme les entrées). C'est le **moyen manuel d'obtenir une ressource** ;
  toute recette reste aussi automatisable (achat de niveaux -> exécution au
  tick). Variante **`manualProduce`** : produit les sorties **gratuitement** (sans
  consommer), pour les widgets où le geste ne doit pas vider le stock. GAME-DESIGN 7.
  Le rendement d'un clic suit `clickYield` (= niveau de la première usine de l'ère
  + 1, multiplié par les galets actifs) : cliquer reste utile et passe à l'échelle
  avec la progression.
- **Franchissement de palier** (`unlockNextEra` / `canUnlockNextEra`) : action
  **manuelle** qui débloque l'ère suivante et **ne dépense pas** la Complexité.
  Aucune ère ne se débloque automatiquement (le cap évite la cascade).
- **Flux** (`graph.ts`) : `netFlows` = **variation réelle** par ressource
  (différence d'un tick simulé, pour l'affichage). Deux alertes en dérivent, sur
  les seuls flux réels : `decliningResources` (rouge) = ressources qui reculent
  (consommées plus vite que produites) ; `stalledResources` (jaune) = sortie de
  convertisseur révélée mais figée autour de zéro (production à l'arrêt). Voir
  [UI-UX.md](./UI-UX.md).

Déterminisme : le tick **ne lit jamais l'horloge** lui-même ; `dt` est fourni.
Cela rend le moteur testable et compatible avec le calcul hors-ligne et la
reprise de sauvegarde.

Boucle : le hook `useTick` cadence le moteur (intervalle fixe, 10 Hz) et applique
`tick` au `gameStore` ; il autosauvegarde périodiquement et **à la fermeture /
mise en arrière-plan** de la page (`pagehide` / `visibilitychange`).

## 6. Réseau de ressources (graph.ts)

- Le graphe est construit à partir des `ConverterDef` (entrées -> sorties).
- Fournit : dépendances d'une ressource, tri topologique (ordre de calcul
  stable), détection de cycles (à éviter ou gérer), et la **profondeur (tier)**
  servant au calcul de Complexité.
- Sert aussi à la **visualisation** du réseau (composant graphe de noeuds
  générique, réutilisé pour molécules / arbre du vivant / tech tree, voir
  [UI-UX.md](./UI-UX.md) section 5).

## 7. Crises (crises.ts)

Implémente la mécanique de [GAME-DESIGN.md](./GAME-DESIGN.md) section 6 :

- **Montée du risque** : la jauge `crises[id].risk` augmente selon
  `risk.sourceResource` (sur-exploitation) ou une règle dédiée.
- **Déclenchement** : `threshold` (auto au seuil), `player` (action explicite),
  ou `probabilistic` (au-delà d'un seuil).
- **Régression** : applique `regression` (ex : `resetResource`,
  `resetGenerator` partiels). Jamais de reset total ni de blocage.
- **Rebond** : applique `rebound` (ex : `transformResource` pour changer une
  ressource en une meilleure, `multiplier` permanent, `unlock`).
- Bénéfice **net positif à terme** garanti par l'équilibrage.

## 8. Prestige (prestige.ts)

- Disponible à l'ère 19. Calcule les Échos à partir de `totalComplexityEver`
  (formule indicative dans [GAME-DESIGN.md](./GAME-DESIGN.md) section 3.3).
- **Reset** : réinitialise `resources`, `generators`, `converters`, `upgrades`,
  `crises`, `unlockedEras`, `currentEraId`, `complexity` ; **conserve** `echoes`
  (incrémentés), `metaUpgrades`, et les compteurs de méta-progression.
- Les `metaUpgrades` modifient les paramètres de la prochaine partie
  (multiplicateurs de départ, automatisations débloquées d'office, etc.).

### 8.1 Galets de l'infini (galets.ts, data/galets.ts)

Collectibles de prestige, **conservés au reset** (comme les Échos). Décrits en
données (`GaletDef` : `effect` = `generatorMultiplier` | `converterMultiplier`,
borné par `maxEraIndex` et valeur). `discoverableGalets` les rend découvrables
quand la Complexité atteint le palier de leur ère ; le joueur les active /
désactive depuis le réceptacle (`GaletReceptacle`). Le moteur applique les
multiplicateurs actifs (`galetGeneratorMultiplier` / `galetConverterMultiplier`)
à la production automatique (tick) ET aux gestes manuels (`manualConvert` /
`manualProduce`), sans toucher au coût des machines.

## 9. Sauvegarde, export/import, idle hors-ligne (save.ts)

- **Persistance** : le `gameStore` écrit dans `localStorage` (clé versionnée)
  via une **autosauvegarde** périodique (`useTick`, ~10 s) ET **à la fermeture /
  mise en arrière-plan** de la page (`pagehide` / `visibilitychange`), pour ne
  rien perdre entre deux autosauvegardes.
- **Versioning + migrations** : `GameState.version` ; un tableau de migrations
  `vN -> vN+1` s'applique à la lecture. Pour un **ajout de champ**, on n'ajoute
  pas forcément de migration : `withDefaults` complète les champs manquants à
  partir de l'état initial (ex : `discovered` ajouté ainsi, sans migration).
  Une vraie évolution incompatible, elle, ajoute une migration.
- **Idle hors-ligne** : à la reprise, `elapsed = now - lastSeen`, **plafonné**
  (anti-triche d'horloge). On crédite la production accumulée (tick en gros pas
  ou approximation fermée). Plafond réglable dans `settingsStore`.
- **Export / import** : `JSON.stringify(state)` (optionnellement encodé base64)
  proposé en téléchargement et en copie presse-papier ; import par collage ou
  fichier, **validé et migré** avant application.

## 10. i18n (custom léger)

- Pattern maison : store Zustand + clés **typées**, FR par défaut, EN proposé.
- `src/i18n/types.ts` définit le contrat de clés ; `translations/fr.ts`,
  `en.ts`. Tout texte affiché (y compris narratif, crises, humour) passe par une
  clé. Les textes humoristiques sont **tagués** (catégorie) pour régler leur
  fréquence (voir GAME-DESIGN section 12).
- Persistance de la langue dans `localStorage`.

## 11. UI et widgets

- Coquille stable + scène centrale = widget iconique de l'ère active (voir
  [UI-UX.md](./UI-UX.md)). Chaque widget lit des **données** (`src/data/`) et
  l'**état** via des sélecteurs Zustand fins.
- Certains widgets sont **interactifs et portent la mécanique de l'ère**,
  enregistrés dans `interactive.ts` (`INTERACTIVE_WIDGETS`) : `BohrAtom` (ère 1),
  `StarNursery` (ère 2), `PeriodicTable` (ère 3). `ClickArea` les route ; les
  larges (`isFullWidthWidget`, ex. le tableau périodique) passent en pleine
  largeur au-dessus des panneaux, les compacts (Bohr, galaxie) restent centrés
  dans les 3 colonnes. C'est l'**exception assumée** au "100% data-driven" :
  une telle ère demande aussi un composant. Voir GAME-DESIGN 7.
- **Évènements narratifs** : modales (`EventModal` + `eventStore` + `useEvents`
  + `lib/events.ts`) au changement d'ère, aux crises et au tuto (anti-rejeu via
  `GameState.seenEvents`).
- **Feedback** : nombres flottants `+X` / `-X` sur les compteurs (`feedbackStore`
  + `FloaterLayer`) ; alerte "!" sur les ressources en déficit (ressource + onglet).
- Paliers de transformation pilotés par `EraDef.uiTier` (bascule de palette/
  layout, transitions majeures aux ères 5/6 et 12).
- SVG d'abord ; Canvas/WebGL pour les scènes denses (Voie lactée, toile
  cosmique, particules). Ne monter que le widget de l'ère active.

## 12. Tests

- **Unitaires (lib)** : `engine` (production, conversion, clamp anti-blocage),
  `graph` (tri topologique, tiers), `crises` (risque/déclenchement/rebond),
  `prestige` (calcul Échos, reset), `save` (round-trip + migrations),
  `format`.
- **Composants** : interactions clés (clic sur widget, achat d'usine, résolution
  de crise, passage d'ère).
- **e2e (Playwright)** : parcours d'une partie courte (vertical slice ères 0-1),
  sauvegarde/rechargement, export/import.
- On teste la **mécanique**, pas l'équilibrage (les nombres bougent).

## 13. Performance

- Sélecteurs Zustand granulaires ; éviter de re-render toute l'UI à chaque tick.
- Découpler la cadence du moteur (ex : 10 Hz) de la cadence d'affichage.
- Widgets denses : virtualisation/throttle ; ne rendre que l'ère active.
- Grands nombres via `format.ts` (jusqu'à la notation scientifique).

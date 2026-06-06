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
│   ├── engine.ts         # tick, coûts, achats, conversion manuelle, franchissement de palier
│   ├── graph.ts          # réseau de ressources : flux nets (réels), dépendances, tri topologique
│   ├── reveal.ts         # dévoilement progressif (machines / ressources)
│   ├── crises.ts         # risque, déclenchement, effets
│   ├── prestige.ts       # Échos, reset New Game+
│   ├── meta.ts           # méta-upgrades de prestige
│   ├── save.ts           # état initial, sérialisation versionnée + migrations, idle, export/import
│   └── format.ts         # notation abrégée des grands nombres
├── data/
│   ├── eras/             # une définition d'ère par fichier (era0..era4, life, civilization, space, transcendence) + factory.ts
│   ├── crises.ts         # définitions de crises
│   ├── metaUpgrades.ts   # définitions des méta-upgrades
│   └── index.ts          # agrégation typée (defs)
├── store/
│   ├── gameStore.ts      # état de jeu + actions + persistance
│   └── feedbackStore.ts  # nombres flottants transitoires (+X / -X), non persisté
├── i18n/                 # i18n custom (voir section 10)
├── hooks/
│   └── useTick.ts        # boucle de jeu + autosauvegarde (+ sauvegarde à la fermeture)
├── components/
│   ├── ui/               # primitives (Button, Panel, Icon, IconBadge, FloaterLayer...)
│   ├── game/             # ressources, machines, paliers, badges, bannières
│   │   └── widgets/      # widgets d'ère (CoolingWidget, BohrWidget... + PeriodicTable interactif, interactive.ts)
│   └── layout/           # coquille, navigation d'ères
└── App.tsx               # navigation par état (pas de router)
```

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
}
```

Règle : tout ce qui dépend du **contenu** (noms, taux, coûts) vit dans les
`*Def`, pas dans `GameState`. À la sauvegarde, on ne stocke que `GameState`.

## 5. Moteur (tick)

Ceur du jeu : une fonction **pure** qui avance l'état d'un pas de temps.

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

- **Conversion manuelle** (`manualConvert`) : applique une recette d'un clic.
  C'est le **moyen manuel d'obtenir une ressource** ; toute recette reste aussi
  automatisable (achat de niveaux -> exécution au tick). Voir GAME-DESIGN 7.
- **Franchissement de palier** (`unlockNextEra` / `canUnlockNextEra`) : action
  **manuelle** qui débloque l'ère suivante et **ne dépense pas** la Complexité.
  Aucune ère ne se débloque automatiquement (le cap évite la cascade).
- **Flux nets** (`graph.ts` `netFlows`) : **variation réelle** par ressource
  (simulation d'un tick), pour l'affichage (voir [UI-UX.md](./UI-UX.md)).

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
- Certains widgets sont **interactifs et portent la mécanique de l'ère** (ex :
  le tableau périodique, `components/game/widgets/PeriodicTable.tsx`, enregistré
  dans `interactive.ts` ; `ClickArea` les route, `GameShell` les place en pleine
  largeur au-dessus des panneaux). C'est l'**exception assumée** au "100%
  data-driven" : une telle ère demande aussi un composant. Voir GAME-DESIGN 7.
- **Feedback** : nombres flottants `+X` / `-X` sur les compteurs
  (`feedbackStore` + `FloaterLayer`).
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

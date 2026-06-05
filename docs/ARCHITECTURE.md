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
  (runtime, sérialisé). Ajouter une ère = ajouter des données + du contenu i18n.
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
├── lib/
│   ├── types.ts        # tous les types du domaine (Def + State)
│   ├── engine.ts       # tick : production, conversion, flux nets, coûts
│   ├── graph.ts        # réseau de ressources : recettes, dépendances, tri
│   ├── crises.ts       # logique des crises (risque, déclenchement, effets)
│   ├── prestige.ts     # calcul des Échos, reset New Game+
│   ├── save.ts         # sérialisation, versioning, migrations, idle offline
│   ├── format.ts       # notation abrégée des grands nombres
│   └── selectors.ts    # dérivations (production nette par ressource, coûts)
├── data/
│   ├── eras/           # une définition d'ère par fichier (0..19)
│   ├── resources.ts    # (ou réparti par ère) ResourceDef
│   ├── widgets.ts      # mapping ère -> widget iconique
│   └── index.ts        # agrégation typée de toutes les données
├── store/
│   ├── gameStore.ts    # état de jeu + actions
│   ├── saveStore.ts    # persistance, export/import
│   └── settingsStore.ts# langue, dark mode, plafond idle
├── i18n/               # i18n custom (voir section 8)
├── hooks/              # useTick, useGame, ...
├── components/
│   ├── ui/             # primitives
│   ├── game/           # ressources, usines, upgrades, crises
│   ├── widgets/        # widgets iconiques (Bohr, Mendeleïev, phylo, Risk...)
│   └── layout/         # coquille, navigation d'ères, paliers UI
└── App.tsx             # navigation par état (pas de router)
```

## 3. Modèle de données (définitions statiques)

```ts
type ResourceId = string
type EraId = string

type UiTier = 'cosmos' | 'vivant' | 'civilisation' | 'spatial' | 'transcendance'

interface ResourceDef {
  id: ResourceId
  eraId: EraId
  nameKey: string        // clé i18n
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

// "Usine" appliquant une recette (convertisseur) : entrées -> sorties
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
  complexity: number           // méta-ressource
  echoes: number               // monnaie de prestige
  metaUpgrades: Record<string, boolean>
  totalComplexityEver: number  // base du calcul de prestige
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
3. **Flux nets** : on dérive la production nette par ressource (+entrées /
   -consommation) pour l'affichage (voir `selectors.ts` et [UI-UX.md](./UI-UX.md)).
4. **Complexité** : chaque combinaison effectuée crédite de la Complexité,
   **pondérée par le `tier`** de la ressource produite (plus c'est profond dans
   le graphe, plus ça rapporte).
5. **Risque des crises** : mettre à jour les jauges de risque (section 7).
6. **Déblocage d'ères** : si une condition `unlock` est remplie, ajouter l'ère
   à `unlockedEras`.

Déterminisme : le tick **ne lit jamais l'horloge** lui-même ; `dt` est fourni.
Cela rend le moteur testable et compatible avec le calcul hors-ligne et la
reprise de sauvegarde.

Boucle : un hook `useTick` cadence le moteur (requestAnimationFrame ou
intervalle fixe, ex : 10 Hz) et applique `tick` au `gameStore`.

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

- **Persistance** : `saveStore` s'abonne au `gameStore`, **throttle** l'écriture
  (ex : toutes les 10 s + sur évènements majeurs) vers `localStorage` sous une
  clé versionnée.
- **Versioning + migrations** : `GameState.version` ; un tableau de migrations
  `vN -> vN+1` applique les transformations à la lecture. Toute évolution de
  schéma ajoute une migration ; on ne casse jamais une save sans migration.
  Les nouveaux contenus (ères, ressources) apparaissent par défaut à 0/non
  débloqués, donc une vieille save reste valide.
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

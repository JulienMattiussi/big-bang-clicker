# Big Bang Clicker - Architecture technique

> Traduction technique des décisions de conception. Principe central :
> **data-driven** (le moteur est générique ; ères, ressources, recettes,
> usines et crises sont des données). Voir
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
│   ├── engine.ts         # tick, coûts (arrondis), achats, conversion manuelle, débits single-source (generatorPerSec/converterOutputPerSec, réutilisés par l'UI), Complexité = production réelle (complexityPerUnit), palier (gelé en crise)
│   ├── graph.ts          # flux nets réels + alertes (déclin / production à zéro), dépendances, tri
│   ├── reveal.ts         # dévoilement progressif (machines / ressources)
│   ├── events.ts         # évènements narratifs déclenchés (transitions, crises, tuto)
│   ├── crises.ts         # risque (plancher + excès), déclenchement, gel de production, régression/rebond
│   ├── prestige.ts       # Échos, reset New Game+
│   ├── meta.ts           # méta-upgrades de prestige
│   ├── save.ts           # état initial, sérialisation versionnée + migrations, idle, export/import, enveloppe SIGNÉE (intégrité) ; rejet de toute save non signée ou modifiée
│   ├── integrity.ts      # empreinte légère (cyrb53 + sel) anti-triche de save ; rejet d'une save modifiée (ralentisseur, pas inviolable, cf. section 9)
│   ├── format.ts         # notation abrégée des grands nombres
│   ├── galets.ts         # galets de l'infini : découverte (palier OU widget), galets affectant générateur/convertisseur/Complexité
│   ├── memory.ts         # mini-jeu de mémoire (ère 7+) : déblocage, coût (10% Complexité), 3 niveaux par ère (×2/×4/×8) ; helpers purs (memoryStart/memoryWin) réutilisés par le store ET le sim
│   └── inventory.ts      # sac à dos : déblocage (apparition d'une ressource) + ressources connues groupées par ère
├── data/
│   ├── eras/             # toutes les ères via factory.ts (buildEra) : cosmos (e1-5), life, civilization, space, transcendence ; easing tardif (LATE_FROM) : prod ↑ / conso ↓ composées à partir de l'ère 12, ères 1-11 intactes
│   ├── crises.ts         # définitions de crises
│   ├── metaUpgrades.ts   # définitions des méta-upgrades
│   ├── galets.ts         # définitions des galets de l'infini
│   └── index.ts          # agrégation typée (defs)
├── store/                # stores Zustand (gameStore persisté ; les autres transitoires)
│   ├── gameStore.ts      # état de jeu + actions + persistance (sauve AUSSITÔT les actions de progression discrètes : achat, déblocage, prestige, crise, galet, mémoire)
│   ├── feedbackStore.ts  # nombres flottants transitoires (+X / -X)
│   ├── clickPulse.ts     # signal générique "verbe activé" (widgets passifs, ex. jauge)
│   ├── eventStore.ts     # file des modales d'évènements (transitions, crises, import de save...)
│   ├── memoryStore.ts    # signal transitoire du mini-jeu de mémoire (flash du bouton)
│   ├── inventoryStore.ts # signal transitoire du sac à dos (flash/atterrissage du bouton)
│   ├── galetStore.ts     # signal transitoire : galet découvert qui se pose sur son socle (FLIP)
│   └── crisisStore.ts    # mini-jeu de crise en cours (id + créatures sauvées ; transitoire)
├── i18n/                 # i18n custom (voir section 10) ; locale persistée en localStorage
├── hooks/
│   ├── useTick.ts        # boucle de jeu + autosauvegarde (+ sauvegarde à la fermeture)
│   ├── useEvents.ts      # détecte et enfile les évènements narratifs
│   ├── useGalets.ts      # découverte des galets au franchissement de palier (announceGalet, partagé avec la découverte par widget)
│   ├── useEraMechanic.ts # geste de clic d'une ère (gain de base + complétion gratuite)
│   ├── useMilestone.ts   # données du palier suivant (jauge NextGoal + bouton MilestoneButton)
│   ├── useArrivalReward.ts # crédite un gain à chaque nouvel élément arrivé (delta d'un total cumulé)
│   ├── useSimLoop.ts     # mini-boucle générique (setInterval) pilotant un « monde » de widget/mini-jeu
│   └── usePageHidden.ts  # signal de page masquée / en arrière-plan (pagehide / visibilitychange)
├── components/
│   ├── ui/               # primitives (Button, Panel, Modal (scrim/dialog/Escape partagés), Icon, IconBadge, AlertBadge, FloaterLayer...) ; introRect.ts (rect/transform partagé des animations d'arrivée : inventaire, mémoire, galet)
│   ├── art/              # graphisme exclusivement : glyphs/ (icônes custom du registre Icon) + illustrations (Galet, Sauropod, OrganismGlyph, PartGlyph, CrisisCreatures, CrisisScene)
│   ├── game/             # ressources, machines (PurchasePanel + MachineRow), paliers, badges, galets ; modales (EventModal + EventHero, layout « hero » partagé) ; crise (CrisisBanner, CrisisGame plein écran + crisisWorld.ts, ResourceCrisisBadge) ; eraTitle.ts (titre « Ère N : Nom »)
│   │   ├── memory/       # mini-jeu de mémoire : MemoryFeature/MemoryGame/MemoryCards/memoryDeck/Answer42 (+EraSymbolCluster), police Neogen
│   │   ├── inventory/    # sac à dos : InventoryButton/InventoryModal
│   │   └── widgets/      # widgets d'ère : passifs (CoolingWidget...) + interactifs (BohrAtom, StarNursery, PeriodicTable, AccretionDisk, PetriDish...) routés par interactive.ts ; helpers svgCoords.ts, StarField.tsx (champ d'étoiles SVG partagé)
│   └── layout/           # coquille, navigation d'ères, EraTransition (glissement), SceneBackground (dispatcher) + scenes/ (un fichier de fond par palier), GaletReceptacle ; eraLayout.ts (disposition de page par ère, voir EraLayoutName)
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

// Disposition de page d'une ère (catalogue : components/layout/eraLayout.ts).
// compact = widget centré sur 3 colonnes ; wide* = widget pleine largeur en
// tête puis ligne ressources | machines (roomy : colonne ressources élargie ;
// split : panneau machines en deux cartes asymétriques).
type EraLayoutName = 'compact' | 'wide' | 'wide-roomy' | 'wide-split'

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
  target?: string        // id de ressource / usine visé
  value?: number
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
  index: number          // 0..18 (19 ères)
  nameKey: string
  uiTier: UiTier
  widget: string         // id du widget iconique (voir UI-UX.md)
  layout: EraLayoutName  // disposition de page : 'compact' | 'wide' | 'wide-roomy' | 'wide-split'
  unlock: { resource?: ResourceId; amount?: number; complexity?: number }
  resources: ResourceId[]
  generators: string[]
  converters: string[]
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
  crises: Record<string, { risk: number; resolved: boolean; count: number }>  // count : nb de résolutions (le moteur dérive le rebond ^count)
  multipliers: Record<string, number>  // surtout 'meta' (recalculé) ; mémoire/crises N'Y écrivent plus (dérivés, cf. 8.2)
  complexity: number           // méta-ressource (plafonnée au prochain palier)
  echoes: number               // monnaie de prestige
  metaUpgrades: Record<string, boolean>
  totalComplexityEver: number  // base du calcul de prestige
  discovered: Record<ResourceId, boolean>  // ressources déjà produites (dévoilement collant)
  seenEvents: Record<string, boolean>      // modales narratives déjà montrées (une fois)
  galets: Record<string, { found: boolean; active: boolean }>  // galets de l'infini (conservés au prestige)
  memoryLevels: Record<EraId, number>      // mini-jeu de mémoire : nombre de boosts par ère (0..3)
  complexityBoosts: Record<EraId, number>  // constellation Simon : 10-séquences réussies par ère (le moteur dérive x2^n sur la Complexité de l'ère, cap MAX_COMPLEXITY_BOOST)
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

1. **Production des générateurs** : via `generatorPerSec(state, defs, id, level)`
   (`level * baseRate * multiplicateurs`) - **la même fonction** que celle lue par
   le panneau machines, pour que l'affichage ne diverge jamais de la production
   réelle. Idem côté convertisseurs (`converterOutputPerSec` / `converterOutputMultiplier`).
2. **Conversions (usines)** : pour chaque convertisseur actif, calculer le
   nombre de cycles réalisables sur `dt` **limité par les entrées
   disponibles**. Consommer les entrées, produire les sorties.
   - **Pas de blocage dur** (règle GAME-DESIGN 3.1ter) : la consommation est
     clampée aux stocks disponibles ; les ressources de base gardent une
     production minimale.
3. **Complexité** : chaque conversion crédite de la Complexité = quantité
   **réellement produite** (multiplicateurs inclus : mémoire, galets, rebond de
   crise, méta) × `complexityPerUnit` (le `tier` de la sortie **décroissant avec
   l'ancienneté de l'ère**, `COMPLEXITY_ERA_DECAY = 50`). Source unique
   `complexityPerUnit` (le tooltip de l'UI la relit, pas de formule dupliquée).
   Puis **plafonnée au coût du prochain palier**. La Complexité ne **recule que
   sur les crises**.
4. **Risque & gel des crises** : `updateRisk` (composé avec `tick`) ; tant qu'une
   crise est déclenchée non résolue, la **production de ses ressources est gelée**
   (et `canUnlockNextEra` renvoie `false`), voir section 7.

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
  machine révélée (générateur OU convertisseur, donc ressources de base
  incluses) figée autour de zéro (production non bâtie, à sec, ou entièrement
  consommée en aval, ex. l'oxygène). Voir [UI-UX.md](./UI-UX.md).

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

- **Montée du risque** : la jauge `crises[id].risk` monte sur l'**excès** de
  `risk.sourceResource` au-dessus d'un **`floor`** (dormante en dessous : pas de
  crise sur une ressource à peine développée).
- **Déclenchement** : `threshold` (auto au seuil), `player` (action explicite),
  ou `probabilistic` (au-delà d'un seuil).
- **Gel + porte** : tant que `isCrisisReady` est vrai, le `tick` **gèle la
  production** des ressources touchées (source + cibles régression/rebond) et
  `canUnlockNextEra` renvoie `false` : on ne peut pas progresser sans résoudre.
- **Régression** puis **rebond** (`resetResource` partiel puis `multiplier`
  permanent, etc.). Bénéfice **net positif à terme**. Jamais de cul-de-sac.
- **Résolution interactive** : une crise peut exposer un **mini-jeu** (composant,
  hors `crises.ts`) au lieu d'un bouton. L'extinction (ère 10) : `CrisisGame`
  plein écran (sauver 50 créatures), piloté par `crisisStore` (transitoire) ;
  `CrisisBanner` annonce/lance, `CrisisScene` illustre, `ResourceCrisisBadge`
  marque les ressources touchées. Voir [GAME-DESIGN](./GAME-DESIGN.md) 6.4.

## 8. Prestige (prestige.ts)

- Disponible à l'ère 19. Calcule les Échos à partir de `totalComplexityEver`
  (formule indicative dans [GAME-DESIGN.md](./GAME-DESIGN.md) section 3.3).
- **Reset** : réinitialise `resources`, `generators`, `converters`,
  `crises`, `unlockedEras`, `currentEraId`, `complexity` ; **conserve** `echoes`
  (incrémentés), `metaUpgrades`, et les compteurs de méta-progression.
- Les `metaUpgrades` modifient les paramètres de la prochaine partie
  (multiplicateurs de départ, automatisations débloquées d'office, etc.).

### 8.1 Galets de l'infini (galets.ts, data/galets.ts)

Collectibles de prestige, **conservés au reset** (comme les Échos). Décrits en
données (`GaletDef` : `effect` = `generatorMultiplier` | `converterMultiplier` |
`complexityMultiplier`, borné par `maxEraIndex` et valeur). Le joueur les active /
désactive depuis le réceptacle (`GaletReceptacle`). Le moteur applique les
multiplicateurs actifs à la production automatique (tick) ET aux gestes manuels
(`manualConvert` / `manualProduce`), sans toucher au coût des machines :
`galetGeneratorMultiplier` (générateurs), `galetConverterMultiplier`
(convertisseurs), `galetComplexityMultiplier` (Complexité gagnée, appliqué dans
`complexityPerUnit`, donc le moteur ET le tooltip "+x/u" en tiennent compte).

**Deux modes de découverte** (`GaletDef.discovery`) :
- `'milestone'` (défaut) : `discoverableGalets` les rend découvrables quand la
  Complexité atteint le palier de leur ère ; `useGalets` les annonce.
- `'widget'` : trouvés en **cliquant** le galet qui apparaît dans le widget de
  l'ère (ex. le **galet de la diversité**, ère 9 : il défile sur le tapis
  d'assemblage une fois `differentiation` au niveau 2, ~toutes les 20-30 pièces ;
  au clic, `announceGalet` ouvre la modale). `discoverableGalets` les **exclut**
  (le widget pilote leur découverte). Helper : `widgetGaletForEra`.

Un galet de Complexité matérialise son effet **sous le diamant de la pastille de
Complexité** (`galetsAffectingComplexity`), comme les autres galets s'affichent
sur les machines qu'ils accélèrent. Le galet de la diversité est peint en
**arc-en-ciel** (motif `rainbow` dans `Galet.tsx`, bandes concentriques colorées).

### 8.2 Effets dérivés : stock en valeur, effets en niveau/booléen (règle)

**Règle d'architecture des sauvegardes** : le **stock** (ressources, Complexité,
Échos) est persisté en **valeur** ; un **effet** (multiplicateur, bonus) ne l'est
**jamais** en valeur calculée, mais via un **booléen ou un niveau**, et le moteur
en **dérive** le multiplicateur depuis les **données** à chaque tick. Ainsi, tout
ajustement d'une valeur dans `data/` se **répercute sur les parties en cours** ;
graver le multiplicateur le figerait pour toujours dans la save.

Sources de multiplicateur, toutes dérivées :
- **Méta-upgrades** : booléens `metaUpgrades[id]` -> `applyMeta` recalcule
  `multipliers.meta` au chargement (`meta.ts`).
- **Galets** : `{ found, active }` -> `galet*Multiplier` lus en direct (`engine.ts`).
- **Mémoire** : niveau `memoryLevels[era]` -> le moteur applique `MEMORY_BOOST^niveau`
  (`memoryResourceMultiplier`). `memoryWin` n'incrémente **que** le niveau.
- **Rebonds de crise** : compteur `crises[id].count` -> le moteur applique
  `valeur^count` (`crisisReboundMultiplier`). `resolveCrisis` n'applique **que**
  les effets de **stock** (resetResource, transformResource), jamais les
  `multiplier`.
- **Bonus constellation (Simon)** : compteur `complexityBoosts[era]` -> le moteur
  applique `COMPLEXITY_BOOST^n` à la Complexité de l'ère (dans `complexityPerUnit`),
  plafonné à `MAX_COMPLEXITY_BOOST` clears. Gagné en reproduisant une séquence de 10.

Le champ `multipliers` ne porte donc plus que la clé `meta` (recalculée) et un
éventuel multiplicateur direct ; mémoire et crises n'y écrivent plus. La migration
v2 -> v3 purge les valeurs gravées des anciennes saves (recalculées ensuite). Voir
section 9.

## 9. Sauvegarde, export/import, idle hors-ligne (save.ts)

- **Persistance** : le `gameStore` écrit dans `localStorage` (clé versionnée)
  via une **autosauvegarde** périodique (`useTick`, ~10 s) ET **à la fermeture /
  mise en arrière-plan** de la page (`pagehide` / `visibilitychange`), pour ne
  rien perdre entre deux autosauvegardes.
- **Versioning + migrations** : `GameState.version` (actuellement **5**) ; un
  tableau de migrations `vN -> vN+1` s'applique à la lecture. Pour un **ajout de
  champ**, on n'ajoute pas forcément de migration : `withDefaults` complète les
  champs manquants à partir de l'état initial (ex : `discovered` ajouté ainsi).
  Une vraie évolution incompatible ajoute une migration : **v2 -> v3** purge les
  multiplicateurs gravés (mémoire/crises désormais dérivés, cf. 8.2) ; **v3 -> v4**
  fusionne l'ère « Intergalactique » dans le Voyage intergalactique et décale les
  ids d'ères suivantes ; **v4 -> v5** retire le champ mort `upgrades` (ancien
  système d'upgrades par ère, supprimé).
- **Idle hors-ligne** : à la reprise, `elapsed = now - lastSeen`, **plafonné**
  (anti-triche d'horloge). On crédite la production accumulée (tick en gros pas
  ou approximation fermée). Plafond réglable dans `settingsStore`.
- **Export / import** : `JSON.stringify(state)` encodé base64, proposé en
  téléchargement et en copie presse-papier ; import par collage ou fichier,
  **validé et migré** avant application.
- **Intégrité (anti-triche de save, `integrity.ts`)** : la save est écrite dans
  une **enveloppe signée** `{ d, s }` (en localStorage ET à l'export), où `s` est
  une empreinte (cyrb53 + sel) de `d`. Au chargement / import, on recalcule et on
  compare ; une discordance = save modifiée hors du jeu -> **rejet** (partie neuve
  + clin d'oeil "on ne hack pas l'univers", ou import refusé). Un cas distinct
  (`'tampered'` vs `'invalid'`) sépare le hack du simple code malformé.
  - **Seules les enveloppes signées sont acceptées** : toute save non signée
    (données brutes, ou enveloppe déshabillée) est rejetée. La tolérance legacy
    (introduite avec `SAVE_VERSION = 2`) a été retirée, la transition étant faite.
  - **Résiste aux évolutions du jeu** (à ne jamais casser) : on vérifie les
    **octets exacts** sauvegardés (`d`), jamais une re-sérialisation, et **avant**
    la migration. Ajouter un champ plus tard ne change pas ces octets : la save
    reste valide et gagne le défaut du champ via `withDefaults`. Donc le **sel**
    doit rester constant à vie (sinon toutes les saves seraient rejetées).
  - **Portée assumée** : jeu 100% front-end et open source -> le sel est dans le
    bundle. C'est un **ralentisseur** contre l'édition facile (localStorage,
    fichier exporté), pas une protection contre l'édition de l'état **en mémoire**
    (devtools) ni un re-signe par qui lit le code. But : décourager la triche de
    base. Éditer le localStorage en cours de partie n'a aucun effet (l'état vit en
    mémoire, relu seulement au chargement, où l'empreinte le rejette).

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
  `StarNursery` (ère 2), `PeriodicTable` (ère 3), etc. `ClickArea` les route. La
  **disposition de la page** ne dépend plus du widget mais du champ
  `EraDef.layout` (`EraLayoutName`), interprété par `eraLayout.ts` (helpers
  `isWideLayout` / `wideRowClass` / `isSplitMachines`, appliqués dans `GameShell`
  et `PurchasePanel`) : `compact` garde le widget centré dans les 3 colonnes, les
  `wide*` le passent en pleine largeur au-dessus de la ligne ressources |
  machines. C'est l'**exception assumée** au "100% data-driven" : une telle ère
  demande aussi un composant. Voir GAME-DESIGN 7.
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

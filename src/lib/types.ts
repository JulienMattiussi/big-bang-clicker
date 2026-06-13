/**
 * Game data model. Key distinction (see docs/ARCHITECTURE.md):
 * - the *Def types are static DEFINITIONS (content, never serialized);
 * - GameState is the runtime STATE (serialized in the save).
 */

export type ResourceId = string
export type EraId = string
export type GeneratorId = string
export type ConverterId = string
export type UpgradeId = string
export type CrisisId = string

export type UiTier = 'cosmos' | 'life' | 'civilization' | 'space' | 'transcendence'

/** An amount of a resource (recipe input/output, cost...). */
export interface ResourceAmount {
  resource: ResourceId
  amount: number
}

/** Geometric cost curve: base * growth^level. */
export interface CostCurve {
  resource: ResourceId
  base: number
  growth: number
}

export interface ResourceDef {
  id: ResourceId
  eraId: EraId
  nameKey: string
  /** Icon identifier (see the Icon registry). */
  icon: string
  /** Chemical symbol for atom resources (e.g. "Si"): shown as the icon instead. */
  symbol?: string
  /** Depth in the combination graph: weights the Complexity gain. */
  tier: number
  /** Produced directly (not only via a recipe). */
  isBase?: boolean
}

/** Machine producing a base resource (generator). */
export interface GeneratorDef {
  id: GeneratorId
  eraId: EraId
  nameKey: string
  output: ResourceId
  baseRate: number
  cost: CostCurve[]
}

/** Machine applying a recipe (converter): inputs -> outputs. */
export interface ConverterDef {
  id: ConverterId
  eraId: EraId
  nameKey: string
  inputs: ResourceAmount[]
  outputs: ResourceAmount[]
  baseRate: number
  cost: CostCurve[]
}

export type EffectType =
  | 'multiplier'
  | 'unlock'
  | 'transformResource'
  | 'grantResource'
  | 'resetResource'
  | 'resetGenerator'
  | 'flatBonus'

export interface Effect {
  type: EffectType
  target?: string
  /** Destination resource (for transformResource: target -> to). */
  to?: ResourceId
  value?: number
}

export interface UpgradeDef {
  id: UpgradeId
  eraId: EraId
  nameKey: string
  descKey: string
  cost: ResourceAmount[]
  requires?: UpgradeId[]
  effects: Effect[]
}

/** Prestige meta-upgrade: a permanent bonus bought with Echoes. */
export interface MetaUpgradeDef {
  id: string
  nameKey: string
  descKey: string
  echoCost: number
  /** Global production multiplier granted (multiplied across owned meta-upgrades). */
  multiplier: number
}

/** Effect of an "infinity pebble" (galet) when active. */
export interface GaletEffect {
  /**
   * What the pebble multiplies, for resources/machines of eras with index <=
   * maxEraIndex:
   * - generatorMultiplier: primary factories (generators);
   * - converterMultiplier: secondary factories (converters/recipes);
   * - complexityMultiplier: the Complexity gained from those eras' resources.
   */
  type: 'generatorMultiplier' | 'converterMultiplier' | 'complexityMultiplier'
  maxEraIndex: number
  value: number
}

/** A collectible "pebble of infinity": found at a milestone, toggleable. */
export interface GaletDef {
  id: string
  nameKey: string
  descKey: string
  /** Contextual flavour text shown in the discovery modal (one per pebble). */
  loreKey: string
  /** Colour of the painted motif (fixed CSS token, not tier-dependent). */
  color: string
  /** Painted motif id drawn on the grey stone (e.g. 'atom'). */
  motif: string
  /** Stone silhouette index (each pebble has a different shape). */
  shape?: number
  /**
   * How the pebble is found:
   * - 'milestone' (default): automatically when this era's milestone becomes
   *   reachable (before crossing it);
   * - 'widget': by clicking it inside the era's interactive widget (it is not
   *   handed out by the milestone path; the widget drives its discovery).
   */
  discovery?: 'milestone' | 'widget'
  /** Era tying the pebble to a milestone ('milestone') or a widget ('widget'). */
  discoverEraId: EraId
  effect: GaletEffect
}

export interface CrisisDef {
  id: CrisisId
  eraId: EraId
  // `floor`: risk only builds once the source resource exceeds this level (real
  // over-exploitation); below it the crisis stays dormant, never triggering on a
  // barely-developed resource.
  risk: {
    sourceResource?: ResourceId
    threshold: number
    telegraph: boolean
    floor?: number
  }
  trigger: 'threshold' | 'player' | 'probabilistic'
  regression: Effect[]
  rebound: Effect[]
  textKeys: { warnKey: string; triggerKey: string; reboundKey: string }
}

export interface EraDef {
  id: EraId
  index: number
  nameKey: string
  /** One-line tagline shown under the era title. */
  taglineKey: string
  /** Title of the resources panel (era-domain vocabulary). */
  stockKey: string
  /** Title of the machines panel (era-domain vocabulary). */
  machinesKey: string
  /** Label of the click button (the era's "verb"). */
  verbKey: string
  /** Resource produced by the manual click. */
  clickResource: ResourceId
  /** Era icon (lucide identifier), shown two-tone. */
  icon: string
  uiTier: UiTier
  widget: string
  unlock: { resource?: ResourceId; amount?: number; complexity?: number }
  resources: ResourceId[]
  generators: GeneratorId[]
  converters: ConverterId[]
  upgrades: UpgradeId[]
  crises: CrisisId[]
}

/** All static game definitions. */
export interface GameDefs {
  eras: EraDef[]
  resources: Record<ResourceId, ResourceDef>
  generators: Record<GeneratorId, GeneratorDef>
  converters: Record<ConverterId, ConverterDef>
  upgrades: Record<UpgradeId, UpgradeDef>
  crises: Record<CrisisId, CrisisDef>
  metaUpgrades: MetaUpgradeDef[]
  galets: GaletDef[]
}

export interface GeneratorState {
  level: number
}

export interface ConverterState {
  level: number
  enabled: boolean
}

export interface CrisisRuntime {
  risk: number
  resolved: boolean
  count: number
}

/** Serializable runtime state (the save). */
export interface GameState {
  version: number
  startedAt: number
  lastSeen: number
  currentEraId: EraId
  unlockedEras: EraId[]
  resources: Record<ResourceId, number>
  generators: Record<GeneratorId, GeneratorState>
  converters: Record<ConverterId, ConverterState>
  upgrades: Record<UpgradeId, boolean>
  crises: Record<CrisisId, CrisisRuntime>
  /** Production multipliers per resource, plus the 'global' and 'meta' keys. */
  multipliers: Record<string, number>
  complexity: number
  echoes: number
  metaUpgrades: Record<string, boolean>
  totalComplexityEver: number
  /** Resources ever produced (>0). Sticky: drives lasting discovery (e.g. periodic table cells). */
  discovered: Record<ResourceId, boolean>
  /** Event-modal ids already shown (so each narrative event fires once). */
  seenEvents: Record<string, boolean>
  /** Infinity pebbles: whether each is found and currently active. */
  galets: Record<string, { found: boolean; active: boolean }>
  /** Memory mini-game: times each era's resource has been boosted (0..3). */
  memoryLevels: Record<EraId, number>
  /** Idea-constellation (Simon) bonus: times a full 10-sequence was cleared in an
   *  era. The engine derives a x2 Complexity multiplier per clear for that era. */
  complexityBoosts: Record<EraId, number>
}

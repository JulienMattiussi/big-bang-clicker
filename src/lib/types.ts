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

export interface CrisisDef {
  id: CrisisId
  eraId: EraId
  risk: { sourceResource?: ResourceId; threshold: number; telegraph: boolean }
  trigger: 'threshold' | 'player' | 'probabilistic'
  regression: Effect[]
  rebound: Effect[]
  textKeys: { warnKey: string; triggerKey: string; reboundKey: string }
}

export interface EraDef {
  id: EraId
  index: number
  nameKey: string
  accrocheKey: string
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
}

/**
 * Modèle de données du jeu. Distinction clé (voir docs/ARCHITECTURE.md) :
 * - les *Def sont des DÉFINITIONS statiques (contenu, jamais sérialisées) ;
 * - GameState est l'ÉTAT runtime (sérialisé dans la sauvegarde).
 */

export type ResourceId = string
export type EraId = string
export type GeneratorId = string
export type ConverterId = string
export type UpgradeId = string
export type CrisisId = string

export type UiTier = 'cosmos' | 'vivant' | 'civilisation' | 'spatial' | 'transcendance'

/** Une quantité d'une ressource (entrée/sortie de recette, coût...). */
export interface ResourceAmount {
  resource: ResourceId
  amount: number
}

/** Courbe de coût géométrique : base * growth^niveau. */
export interface CostCurve {
  resource: ResourceId
  base: number
  growth: number
}

export interface ResourceDef {
  id: ResourceId
  eraId: EraId
  nameKey: string
  /** Profondeur dans le graphe de combinaison : pondère le gain de Complexité. */
  tier: number
  /** Productible directement (pas seulement via une recette). */
  isBase?: boolean
}

/** Usine produisant une ressource de base (générateur). */
export interface GeneratorDef {
  id: GeneratorId
  eraId: EraId
  nameKey: string
  output: ResourceId
  baseRate: number
  cost: CostCurve[]
}

/** Usine appliquant une recette (convertisseur) : entrées -> sorties. */
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
  /** Ressource de destination (pour transformResource : target -> to). */
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
  uiTier: UiTier
  widget: string
  unlock: { resource?: ResourceId; amount?: number; complexity?: number }
  resources: ResourceId[]
  generators: GeneratorId[]
  converters: ConverterId[]
  upgrades: UpgradeId[]
  crises: CrisisId[]
}

/** Toutes les définitions statiques du jeu. */
export interface GameDefs {
  eras: EraDef[]
  resources: Record<ResourceId, ResourceDef>
  generators: Record<GeneratorId, GeneratorDef>
  converters: Record<ConverterId, ConverterDef>
  upgrades: Record<UpgradeId, UpgradeDef>
  crises: Record<CrisisId, CrisisDef>
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

/** État runtime sérialisable (la sauvegarde). */
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
  /** Multiplicateurs de production par ressource, plus la clé 'global'. */
  multipliers: Record<string, number>
  complexity: number
  echoes: number
  metaUpgrades: Record<string, boolean>
  totalComplexityEver: number
}

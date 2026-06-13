import type {
  ConverterDef,
  CostCurve,
  EraDef,
  GeneratorDef,
  ResourceAmount,
  ResourceDef,
  UiTier,
} from '@/lib/types'

/**
 * Era factory. An era is a clickable BASE resource (produced by a generator) and
 * a CHAIN of converters, each consuming resources to produce the next one. The
 * common case (a single recipe: base + a resource from an earlier era -> a
 * combined resource) has a terse shorthand (`combined`/`consumes`/`converterId`).
 * Richer eras (a multi-step chain, e.g. stellar nucleosynthesis) pass an explicit
 * `chain`. i18n keys are derived from the identifiers (res./gen./conv./era.<id>.*).
 */

/** A resource introduced by an era: its base, or a chain link's product. */
export interface EraResourceSpec {
  id: string
  icon: string
  tier: number
  /** Chemical symbol (e.g. "Si"): shown instead of the icon. */
  symbol?: string
}

/** One converter step: consume `inputs`, produce `produces` (one unit). */
export interface ChainLink {
  produces: EraResourceSpec
  converterId: string
  inputs: ResourceAmount[]
  /** Converter label key; defaults to `conv.<converterId>`. */
  nameKey?: string
  /** Recipes per second at level 1 (default 0.5). */
  baseRate?: number
  /** Units produced per recipe (default 1). */
  outputAmount?: number
  /** Level-up cost curve (default: 250 of the base resource, growth 1.15). */
  cost?: CostCurve[]
}

export interface SimpleEraSpec {
  id: string
  index: number
  uiTier: UiTier
  icon: string
  widget?: string
  base: EraResourceSpec
  generatorId: string
  /** Cost of the generator's first level (default 100). */
  generatorBase?: number
  /** Generator cost growth per level (default 1.12). */
  generatorGrowth?: number
  /** Generator output per level (default 1); raises its productivity. */
  generatorRate?: number
  /** Complexity needed to unlock the era; omit for the starting era. */
  unlockComplexity?: number

  // --- Terse single-recipe form: base*10 + `consumes`*1 -> `combined`. ---
  combined?: EraResourceSpec
  consumes?: string
  converterId?: string
  /** Units of `combined` produced per recipe (default 1); raises output without
   *  touching consumption. */
  converterOutput?: number

  // --- General multi-recipe form (takes precedence over the terse fields). ---
  chain?: ChainLink[]
}

export interface EraBundle {
  era: EraDef
  resources: ResourceDef[]
  generators: GeneratorDef[]
  converters: ConverterDef[]
}

/**
 * Late-game progression easing. From era LATE_FROM onward (and ONLY from there -
 * the earlier eras are untouched, their balance is good), production is raised and
 * consumption lowered, COMPOUNDING per era past the threshold, to counter the
 * x3.16/era milestone growth once the big side-mechanic boosts (galets <= era 9,
 * crisis rebound <= era 10) no longer apply. Tunable; validated via `make sim`.
 */
const LATE_FROM = 11
const LATE_PROD = 1.55 // production x LATE_PROD^(idx - LATE_FROM + 1)
const LATE_CONSUMPTION = 0.92 // converter inputs x LATE_CONSUMPTION^(idx - LATE_FROM + 1)

export function buildEra(spec: SimpleEraSpec): EraBundle {
  const { id, base } = spec
  // Era index (e11 -> 11). Late eras get an easing multiplier; earlier ones get 1.
  const eraIdx = Number(id.slice(1)) || 0
  const steps = Math.max(0, eraIdx - LATE_FROM + 1)
  const prodMult = LATE_PROD ** steps
  const consMult = LATE_CONSUMPTION ** steps

  // The terse form is just a one-link chain (base*10 + consumes*1 -> combined).
  const links: ChainLink[] =
    spec.chain ??
    (() => {
      if (!spec.combined || !spec.consumes || !spec.converterId) {
        throw new Error(`Era ${id}: provide either a chain or combined/consumes/converterId`)
      }
      return [
        {
          produces: spec.combined,
          converterId: spec.converterId,
          outputAmount: spec.converterOutput,
          inputs: [
            { resource: base.id, amount: 10 },
            { resource: spec.consumes, amount: 1 },
          ],
        },
      ]
    })()

  const toResource = (r: EraResourceSpec, isBase = false): ResourceDef => ({
    id: r.id,
    eraId: id,
    nameKey: `res.${r.id}`,
    icon: r.icon,
    ...(r.symbol ? { symbol: r.symbol } : {}),
    tier: r.tier,
    ...(isBase ? { isBase: true } : {}),
  })

  const resources: ResourceDef[] = [
    toResource(base, true),
    ...links.map((l) => toResource(l.produces)),
  ]

  const generators: GeneratorDef[] = [
    {
      id: spec.generatorId,
      eraId: id,
      nameKey: `gen.${spec.generatorId}`,
      output: base.id,
      baseRate: (spec.generatorRate ?? 1) * prodMult,
      cost: [
        {
          resource: base.id,
          base: spec.generatorBase ?? 100,
          growth: spec.generatorGrowth ?? 1.12,
        },
      ],
    },
  ]

  const converters: ConverterDef[] = links.map((l) => ({
    id: l.converterId,
    eraId: id,
    nameKey: l.nameKey ?? `conv.${l.converterId}`,
    // Late eras: cheaper inputs (consMult <= 1) and a bigger output (prodMult >= 1).
    inputs: l.inputs.map((i) => ({ ...i, amount: i.amount * consMult })),
    outputs: [{ resource: l.produces.id, amount: (l.outputAmount ?? 1) * prodMult }],
    baseRate: l.baseRate ?? 0.5,
    cost: l.cost ?? [{ resource: base.id, base: 250, growth: 1.15 }],
  }))

  const era: EraDef = {
    id,
    index: spec.index,
    nameKey: `era.${id}.name`,
    taglineKey: `era.${id}.tagline`,
    stockKey: `era.${id}.stock`,
    machinesKey: `era.${id}.machines`,
    verbKey: `era.${id}.verb`,
    clickResource: base.id,
    icon: spec.icon,
    uiTier: spec.uiTier,
    widget: spec.widget ?? 'generic',
    unlock: spec.unlockComplexity != null ? { complexity: spec.unlockComplexity } : {},
    resources: resources.map((r) => r.id),
    generators: [spec.generatorId],
    converters: converters.map((c) => c.id),
    upgrades: [],
    crises: [],
  }

  return { era, resources, generators, converters }
}

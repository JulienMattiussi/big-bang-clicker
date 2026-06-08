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
  /** Complexity needed to unlock the era; omit for the starting era. */
  unlockComplexity?: number

  // --- Terse single-recipe form: base*10 + `consumes`*1 -> `combined`. ---
  combined?: EraResourceSpec
  consumes?: string
  converterId?: string

  // --- General multi-recipe form (takes precedence over the terse fields). ---
  chain?: ChainLink[]
}

export interface EraBundle {
  era: EraDef
  resources: ResourceDef[]
  generators: GeneratorDef[]
  converters: ConverterDef[]
}

export function buildEra(spec: SimpleEraSpec): EraBundle {
  const { id, base } = spec

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
      baseRate: 1,
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
    inputs: l.inputs,
    outputs: [{ resource: l.produces.id, amount: 1 }],
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

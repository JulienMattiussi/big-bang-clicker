import type { ConverterDef, EraDef, GeneratorDef, ResourceDef, UiTier } from '@/lib/types'

/**
 * "Standard" era factory: 1 base resource (click + generator) and 1 combined
 * resource (converter consuming the base + a resource from an earlier era, for
 * chaining). Avoids duplicating the same shape. i18n keys are derived from the
 * identifiers (res./gen./conv./era.<id>.*).
 */

export interface SimpleEraSpec {
  id: string
  index: number
  uiTier: UiTier
  icon: string
  widget?: string
  base: { id: string; icon: string; tier: number }
  combined: { id: string; icon: string; tier: number }
  /** Resource from an earlier era consumed by the converter. */
  consumes: string
  generatorId: string
  converterId: string
  unlockComplexity: number
}

export interface EraBundle {
  era: EraDef
  resources: ResourceDef[]
  generators: GeneratorDef[]
  converters: ConverterDef[]
}

export function buildEra(spec: SimpleEraSpec): EraBundle {
  const { id, base, combined } = spec

  const resources: ResourceDef[] = [
    {
      id: base.id,
      eraId: id,
      nameKey: `res.${base.id}`,
      icon: base.icon,
      tier: base.tier,
      isBase: true,
    },
    {
      id: combined.id,
      eraId: id,
      nameKey: `res.${combined.id}`,
      icon: combined.icon,
      tier: combined.tier,
    },
  ]

  const generators: GeneratorDef[] = [
    {
      id: spec.generatorId,
      eraId: id,
      nameKey: `gen.${spec.generatorId}`,
      output: base.id,
      baseRate: 1,
      cost: [{ resource: base.id, base: 100, growth: 1.12 }],
    },
  ]

  const converters: ConverterDef[] = [
    {
      id: spec.converterId,
      eraId: id,
      nameKey: `conv.${spec.converterId}`,
      inputs: [
        { resource: base.id, amount: 10 },
        { resource: spec.consumes, amount: 1 },
      ],
      outputs: [{ resource: combined.id, amount: 1 }],
      baseRate: 0.5,
      cost: [{ resource: base.id, base: 250, growth: 1.15 }],
    },
  ]

  const era: EraDef = {
    id,
    index: spec.index,
    nameKey: `era.${id}.name`,
    accrocheKey: `era.${id}.accroche`,
    stockKey: `era.${id}.stock`,
    machinesKey: `era.${id}.machines`,
    verbKey: `era.${id}.verb`,
    clickResource: base.id,
    icon: spec.icon,
    uiTier: spec.uiTier,
    widget: spec.widget ?? 'generic',
    unlock: { complexity: spec.unlockComplexity },
    resources: [base.id, combined.id],
    generators: [spec.generatorId],
    converters: [spec.converterId],
    upgrades: [],
    crises: [],
  }

  return { era, resources, generators, converters }
}

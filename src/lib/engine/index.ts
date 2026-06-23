/**
 * Game engine: PURE functions (no React, no side effects). Everything is
 * testable and deterministic (`dt` is provided, never read from the clock).
 * Split by concern (cost, eras, multipliers, rates, complexity, actions, tick);
 * this barrel keeps the public `@/lib/engine` surface stable.
 * See docs/ARCHITECTURE.md section 5.
 */

export { costAtLevel, nextCost, canAfford } from './cost'
export { nextLockedEra, canUnlockNextEra, unlockNextEra } from './eras'
export { galetConverterMultiplier, galetConsumptionMultiplier } from './multipliers'
export {
  generatorPerSec,
  converterCyclesPerSec,
  converterOutputMultiplier,
  converterOutputPerSec,
  clickYield,
} from './rates'
export { COMPLEXITY_ERA_DECAY, MAX_COMPLEXITY_BOOST, complexityPerUnit } from './complexity'
export {
  applyClick,
  buyGenerator,
  buyConverter,
  canManualConvert,
  manualConvert,
  manualProduce,
} from './actions'
export { tick } from './tick'

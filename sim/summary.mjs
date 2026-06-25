/**
 * Prints a readable table for one simulation snapshot, so a run can be analysed
 * without re-reading the result JSON by hand.
 *
 *   node sim/summary.mjs            # the latest snapshot (newest sim/results dir)
 *   node sim/summary.mjs <dir>      # a specific snapshot dir
 *
 * Snapshot dirs are named with a sortable timestamp prefix, so "latest" is the
 * lexically-greatest name (NOT the newest mtime: pruning bumps dir mtimes).
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'

const RESULTS = 'sim/results'

function latestSnapshot() {
  const dirs = readdirSync(RESULTS)
    .filter((n) => statSync(join(RESULTS, n)).isDirectory())
    .sort()
  if (!dirs.length) throw new Error(`no snapshot in ${RESULTS}/ (run \`make sim\` first)`)
  return join(RESULTS, dirs[dirs.length - 1])
}

const dir = process.argv[2] ?? latestSnapshot()
const files = readdirSync(dir)
  .filter((n) => n.endsWith('.json'))
  .sort()
if (!files.length) throw new Error(`no result JSON in ${dir}`)

const runs = files.map((f) => JSON.parse(readFileSync(join(dir, f), 'utf8')))
const first = runs[0]

const days = (s) => (s / 86400).toFixed(1)
const sci = (n) => n.toExponential(2)
const maxComplexity = (r) => Math.max(0, ...r.series.map((p) => p.complexity))
/** Renaissance label: r0, or r2(boostClick+boostGalet). */
const rebirthTag = (r) => `r${r.rebirths}${r.metaUpgrades.length ? `(${r.metaUpgrades.join('+')})` : ''}`
/** finalEraIndex is 0-based; the in-game era number is +1 (Ère N). */
const finalEra = (r) => `e${r.finalEraIndex + 1} ${r.milestones[r.finalEraIndex]?.eraName ?? '?'}`
const endState = (r) => (r.reachedDestruction ? 'DESTRUCTION' : r.stuck ? 'STUCK' : 'horizon')

console.log(`Snapshot : ${dir}`)
console.log(`Commit   : ${first.gitCommit}   données : ${first.defsHash}   ${first.generatedAt}`)
console.log(`Horizon  : ~11,5 jours-jeu (MAX_ITERS) ; un run s'arrête avant si DESTRUCTION ou STUCK\n`)

const head = ['profil', 'pol', 'renais.', 'ère finale', 'fin', 'cplx max', 'jours', 'wall']
const rows = runs.map((r) => [
  r.profileId,
  r.unlockPolicy,
  rebirthTag(r),
  finalEra(r),
  endState(r),
  sci(maxComplexity(r)),
  days(r.totalTimeS),
  `${(r.wallMs / 1000).toFixed(0)}s`,
])

const widths = head.map((h, i) => Math.max(h.length, ...rows.map((row) => row[i].length)))
const fmt = (row) => row.map((c, i) => c.padEnd(widths[i])).join('  ')
console.log(fmt(head))
console.log(widths.map((w) => '-'.repeat(w)).join('  '))
for (const row of rows) console.log(fmt(row))

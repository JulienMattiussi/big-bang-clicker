import { test } from 'vitest'
import { mkdirSync, writeFileSync, readdirSync, rmSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { defs } from '@/data'
import { PROFILES, UNLOCK_POLICIES } from './profiles'
import { simulate } from './simulate'

/** How many past snapshots to keep (older ones are pruned). */
const KEEP_SNAPSHOTS = 8

function gitCommit(): string {
  try {
    return execSync('git rev-parse --short HEAD', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return 'nogit'
  }
}

/** Short hash of the game data, so a result is tied to a known balance. */
function defsHash(): string {
  return createHash('sha1').update(JSON.stringify(defs)).digest('hex').slice(0, 12)
}

test('run balance simulations', () => {
  const generatedAt = new Date().toISOString()
  const commit = gitCommit()
  // A snapshot per `make sim`: sortable id (timestamp) + readable label, so the
  // viewer can overlay successive runs and tell them apart.
  const runId = `${generatedAt.slice(0, 16).replace(/[:T]/g, '-')}__${commit}`
  const runLabel = `${generatedAt.slice(5, 16).replace('T', ' ')} (#${commit})`
  const meta = { runId, runLabel, gitCommit: commit, defsHash: defsHash(), generatedAt }

  const dir = `sim/results/${runId}`
  mkdirSync(dir, { recursive: true })

  // Each profile x policy is run twice: a normal run, and a prestige run (one
  // prestige then a second run with the bonuses), so the viewer can compare them.
  const MODES = [false, true] as const
  const total = PROFILES.length * UNLOCK_POLICIES.length * MODES.length
  let n = 0
  for (const profile of PROFILES) {
    for (const policy of UNLOCK_POLICIES) {
      for (const prestige of MODES) {
        const result = simulate(profile, policy, meta, prestige)
        const mode = prestige ? 'prestige' : 'normal'
        writeFileSync(`${dir}/${profile.id}__${policy}__${mode}.json`, JSON.stringify(result))
        n++
        const reached = result.milestones[result.finalEraIndex]
        const days = (result.totalTimeS / 86400).toFixed(1)
        console.log(
          `[${n}/${total}] ${result.label}: reached ${reached?.eraName ?? '?'} (e${result.finalEraIndex}) in ${days}d${result.stuck ? ' [stuck]' : ''}${prestige ? ` [+${result.echoes} echoes]` : ''}`,
        )
      }
    }
  }

  // Prune old snapshots (keep the most recent KEEP_SNAPSHOTS). Snapshot dirs are
  // named with a sortable timestamp prefix, so a lexical sort is chronological.
  const snapshots = readdirSync('sim/results', { withFileTypes: true })
    .filter((x) => x.isDirectory())
    .map((x) => x.name)
    .sort()
  for (const old of snapshots.slice(0, Math.max(0, snapshots.length - KEEP_SNAPSHOTS))) {
    rmSync(`sim/results/${old}`, { recursive: true })
  }

  console.log(`\nWrote ${total} runs to ${dir}. Open the viewer: /sim/viewer/`)
})

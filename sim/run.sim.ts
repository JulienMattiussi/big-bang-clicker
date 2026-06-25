import { test } from 'vitest'
import { mkdirSync, writeFileSync, readdirSync, rmSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { defs } from '@/data'
import { PROFILES, UNLOCK_POLICIES } from './profiles'
import { simulate } from './simulate'
import type { ProfileConfig, RebirthConfig, UnlockPolicy } from './types'

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

/**
 * Selects which run(s) to play from environment variables, so a single run can be
 * targeted from the CLI:
 *   SIM_PROFILE=active SIM_POLICY=ready SIM_REBIRTHS=2 SIM_META=spark,echo make sim
 * - SIM_PROFILE : one profile id (omit to run every profile).
 * - SIM_POLICY  : 'asap' | 'ready' (omit to run both).
 * - SIM_REBIRTHS: renaissance level started from (each = 1 Echo); default 0.
 * - SIM_META    : comma-separated meta-upgrade ids owned (the Echo allocation).
 * The renaissance bonuses are pre-applied and ONE pass is simulated (no multi-tour).
 */
function planRuns(): { profile: ProfileConfig; policy: UnlockPolicy; rebirth: RebirthConfig }[] {
  const env = process.env
  const rebirths = Math.max(0, Number(env.SIM_REBIRTHS ?? 0) || 0)
  const metaUpgrades = (env.SIM_META ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)

  const known = new Set(defs.metaUpgrades.map((m) => m.id))
  const unknownMeta = metaUpgrades.filter((id) => !known.has(id))
  if (unknownMeta.length) {
    throw new Error(
      `SIM_META: unknown meta-upgrade(s) ${unknownMeta.join(', ')}. Known: ${[...known].join(', ')}`,
    )
  }
  if (metaUpgrades.length > rebirths) {
    throw new Error(
      `SIM_META allocates ${metaUpgrades.length} Echoes but SIM_REBIRTHS is ${rebirths} (1 Echo per rebirth).`,
    )
  }

  const profiles = env.SIM_PROFILE
    ? [
        PROFILES.find((p) => p.id === env.SIM_PROFILE) ??
          (() => {
            throw new Error(
              `SIM_PROFILE: unknown profile ${env.SIM_PROFILE}. Known: ${PROFILES.map((p) => p.id).join(', ')}`,
            )
          })(),
      ]
    : PROFILES
  const policies = env.SIM_POLICY ? [env.SIM_POLICY as UnlockPolicy] : UNLOCK_POLICIES

  const rebirth: RebirthConfig = { rebirths, metaUpgrades }
  const runs = []
  for (const profile of profiles) for (const policy of policies) runs.push({ profile, policy, rebirth })
  return runs
}

test('run balance simulations', () => {
  const generatedAt = new Date().toISOString()
  const commit = gitCommit()
  // A targeted run (SIM_PROFILE set) tags its snapshot with the profile/policy/
  // renaissance, so r0 and r1 land as DISTINCT, self-describing entries in the
  // viewer's snapshot list instead of two look-alike timestamps.
  const env = process.env
  const rb = Math.max(0, Number(env.SIM_REBIRTHS ?? 0) || 0)
  const metaIds = (env.SIM_META ?? '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
  const tag = env.SIM_PROFILE
    ? `${env.SIM_PROFILE} ${env.SIM_POLICY ?? 'asap+ready'} r${rb}${metaIds.length ? `(${metaIds.join('+')})` : ''}`
    : ''
  const slug = tag.replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '')
  // A snapshot per `make sim`: sortable id (timestamp) + readable label, so the
  // viewer can overlay successive runs and tell them apart.
  const runId = `${generatedAt.slice(0, 16).replace(/[:T]/g, '-')}__${commit}${slug ? `__${slug}` : ''}`
  const runLabel = `${generatedAt.slice(5, 16).replace('T', ' ')}${tag ? ` · ${tag}` : ''}`
  const meta = { runId, runLabel, gitCommit: commit, defsHash: defsHash(), generatedAt }

  const dir = `sim/results/${runId}`
  mkdirSync(dir, { recursive: true })

  const runs = planRuns()
  let n = 0
  for (const { profile, policy, rebirth } of runs) {
    const result = simulate(profile, policy, meta, rebirth)
    const tag = rebirth.rebirths > 0 ? `__r${rebirth.rebirths}` : ''
    const metaTag = rebirth.metaUpgrades.length ? `_${rebirth.metaUpgrades.join('-')}` : ''
    writeFileSync(`${dir}/${profile.id}__${policy}${tag}${metaTag}.json`, JSON.stringify(result))
    n++
    const reached = result.milestones[result.finalEraIndex]
    const end = result.reachedDestruction
      ? `destroyed the universe in ${(result.destroyedAtS! / 86400).toFixed(1)}d`
      : `reached ${reached?.eraName ?? '?'} (e${result.finalEraIndex}) in ${(result.totalTimeS / 86400).toFixed(1)}d${result.stuck ? ' [stuck]' : ''}`
    console.log(`[${n}/${runs.length}] ${result.label}: ${end} | ${(result.wallMs / 1000).toFixed(1)}s wall`)
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

  console.log(`\nWrote ${runs.length} run(s) to ${dir}. Open the viewer: /sim/viewer/`)
})

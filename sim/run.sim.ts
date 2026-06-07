import { test } from 'vitest'
import { mkdirSync, writeFileSync } from 'node:fs'
import { execSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { defs } from '@/data'
import { PROFILES, UNLOCK_POLICIES } from './profiles'
import { simulate } from './simulate'

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
  const meta = {
    gitCommit: gitCommit(),
    defsHash: defsHash(),
    generatedAt: new Date().toISOString(),
  }
  mkdirSync('sim/results', { recursive: true })

  const total = PROFILES.length * UNLOCK_POLICIES.length
  let n = 0
  for (const profile of PROFILES) {
    for (const policy of UNLOCK_POLICIES) {
      const result = simulate(profile, policy, meta)
      writeFileSync(`sim/results/${profile.id}__${policy}.json`, JSON.stringify(result))
      n++
      const reached = result.milestones[result.finalEraIndex]
      const days = (result.totalTimeS / 86400).toFixed(1)
      console.log(
        `[${n}/${total}] ${result.label}: reached ${reached?.eraName ?? '?'} (e${result.finalEraIndex}) in ${days}d${result.stuck ? ' [stuck]' : ''}`,
      )
    }
  }
  console.log(`\nWrote ${total} runs to sim/results/. Open the viewer: /sim/viewer/`)
})

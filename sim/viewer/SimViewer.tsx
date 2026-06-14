import { useState } from 'react'
import { defs } from '@/data'
import { fr } from '@/i18n/translations/fr'
import { formatNumber } from '@/lib/format'
import { Icon } from '@/components/ui/Icon'
import { LineChart, type LineSeries } from './charts'
import type { RunResult } from '../types'

/** Era icon by index, for labelling the x axis of the milestone chart. */
const ERA_ICON: Record<number, string> = Object.fromEntries(
  defs.eras.map((e) => [e.index, e.icon]),
)

// Load every snapshot's result JSON (one folder per `make sim`). Drop/refresh a
// snapshot and it appears here on reload.
const modules = import.meta.glob('../results/*/*.json', { eager: true }) as Record<
  string,
  { default: RunResult }
>
const ALL_RUNS: RunResult[] = Object.values(modules)
  .map((m) => m.default)
  .sort((a, b) => b.runId.localeCompare(a.runId) || a.label.localeCompare(b.label))

/** Snapshots (one per `make sim`), newest first. */
const SNAPSHOTS = [...new Map(ALL_RUNS.map((r) => [r.runId, r.runLabel])).entries()]
  .sort((a, b) => b[0].localeCompare(a[0]))
  .map(([id, label]) => ({ id, label }))

/** Distinct profile x policy combos (shared across snapshots). */
const RUN_KINDS = [...new Map(ALL_RUNS.map((r) => [`${r.profileId}__${r.unlockPolicy}`, r])).values()]

const PROFILE_COLOR: Record<string, string> = {
  minimal: 'var(--color-era-2)',
  casual: 'var(--color-secondary)',
  active: 'var(--color-accent)',
  optimal: 'var(--color-octarine)',
}
const runKey = (r: RunResult) => `${r.profileId}__${r.unlockPolicy}`
const uid = (r: RunResult) => `${r.runId}__${runKey(r)}`
const colorFor = (r: RunResult) => PROFILE_COLOR[r.profileId] ?? 'var(--color-fg)'
const isDashed = (r: RunResult) => r.unlockPolicy === 'ready'

function fmtDuration(s: number | null): string {
  if (s === null) return '-'
  if (s < 60) return `${Math.round(s)} s`
  if (s < 3600) return `${(s / 60).toFixed(1)} min`
  if (s < 86400) return `${(s / 3600).toFixed(1)} h`
  return `${(s / 86400).toFixed(1)} j`
}

function machineName(id: string): string {
  const key = defs.generators[id]?.nameKey ?? defs.converters[id]?.nameKey
  return (key && (fr as Record<string, string>)[key]) || id
}

export function SimViewer() {
  // By default overlay only the newest snapshot; tick more to compare.
  const [snapsOn, setSnapsOn] = useState<Set<string>>(
    new Set(SNAPSHOTS.slice(0, 1).map((s) => s.id)),
  )
  const [kindsOn, setKindsOn] = useState<Set<string>>(new Set(RUN_KINDS.map(runKey)))
  const [detail, setDetail] = useState<string>(ALL_RUNS[0] ? uid(ALL_RUNS[0]) : '')

  if (ALL_RUNS.length === 0) {
    return (
      <main data-tier="cosmos" className="min-h-screen bg-bg p-8 text-fg">
        <h1 className="text-2xl font-bold">Simulations d'équilibrage</h1>
        <p className="mt-4 text-muted">
          Aucun résultat. Lance <code className="rounded bg-surface px-1.5 py-0.5">make sim</code>{' '}
          puis recharge cette page.
        </p>
      </main>
    )
  }

  const runs = ALL_RUNS.filter((r) => snapsOn.has(r.runId) && kindsOn.has(runKey(r)))
  const toggleSet = (set: Set<string>, id: string) => {
    const next = new Set(set)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  }

  // Older snapshots are drawn fainter so the newest stays prominent.
  const activeSnaps = SNAPSHOTS.filter((s) => snapsOn.has(s.id))
  const snapOpacity = (rid: string) => {
    const i = activeSnaps.findIndex((s) => s.id === rid)
    return i <= 0 ? 1 : Math.max(0.25, 1 - i * 0.35)
  }

  const meta = ALL_RUNS[0]
  const mixedDefs = runs.some((r) => r.defsHash !== runs[0]?.defsHash)
  const detailRun = ALL_RUNS.find((r) => uid(r) === detail) ?? runs[0]

  // Chart A: cumulative time to unlock each era. Chart B: complexity over time.
  const timeSeries: LineSeries[] = runs.map((r) => ({
    key: uid(r),
    color: colorFor(r),
    dashed: isDashed(r),
    opacity: snapOpacity(r.runId),
    points: r.milestones
      .filter((m) => m.unlockedAtS !== null)
      .map((m) => ({ x: m.eraIndex, y: Math.max(m.unlockedAtS ?? 1, 1) })),
  }))
  const complexitySeries: LineSeries[] = runs.map((r) => ({
    key: uid(r),
    color: colorFor(r),
    dashed: isDashed(r),
    opacity: snapOpacity(r.runId),
    points: r.series.map((p) => ({ x: Math.max(p.t, 1), y: Math.max(p.complexity, 1) })),
  }))

  const maxEra = Math.max(0, ...runs.map((r) => r.finalEraIndex))
  const eraTicks = Array.from({ length: maxEra + 1 }, (_, i) => i)

  // Table rows grouped by profile x policy then snapshot, for easy comparison.
  const tableRuns = [...runs].sort(
    (a, b) => runKey(a).localeCompare(runKey(b)) || b.runId.localeCompare(a.runId),
  )

  return (
    <main data-tier="cosmos" className="min-h-screen bg-bg p-6 text-fg">
      <header className="mb-5">
        <h1 className="text-2xl font-bold">Simulations d'équilibrage</h1>
        <p className="mt-1 text-sm text-muted">
          {activeSnaps.length} snapshot(s) superposé(s) · dernier : données{' '}
          <code className="text-fg">{meta.defsHash}</code> · commit{' '}
          <code className="text-fg">{meta.gitCommit}</code>
          {mixedDefs ? (
            <span className="ml-2 text-accent">⚠ snapshots issus de données différentes</span>
          ) : null}
        </p>
      </header>

      {/* Snapshot picker (one per `make sim`): tick several to overlay them. */}
      <section className="mb-4">
        <span className="text-xs font-semibold text-muted uppercase">Snapshots</span>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
          {SNAPSHOTS.map((s, i) => (
            <label key={s.id} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={snapsOn.has(s.id)}
                onChange={() => setSnapsOn((prev) => toggleSet(prev, s.id))}
              />
              <span style={{ opacity: snapsOn.has(s.id) ? snapOpacity(s.id) : 0.4 }}>
                {s.label}
                {i === 0 ? <span className="ml-1 text-xs text-muted">(dernier)</span> : null}
              </span>
            </label>
          ))}
        </div>
      </section>

      {/* Profile x policy toggles (apply to every selected snapshot). */}
      <section className="mb-6 flex flex-col gap-1.5">
        {(['asap', 'ready'] as const).map((policy) => (
          <div key={policy} className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <span className="w-12 shrink-0 text-xs font-semibold text-muted uppercase">{policy}</span>
            {RUN_KINDS.filter((r) => r.unlockPolicy === policy).map((r) => (
              <label key={runKey(r)} className="flex cursor-pointer items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={kindsOn.has(runKey(r))}
                  onChange={() => setKindsOn((prev) => toggleSet(prev, runKey(r)))}
                />
                <span
                  aria-hidden
                  className="inline-block h-0 w-6 border-t-2"
                  style={{ borderColor: colorFor(r), borderStyle: isDashed(r) ? 'dashed' : 'solid' }}
                />
                {r.profileLabel}
              </label>
            ))}
          </div>
        ))}
        <span className="mt-1 text-xs text-muted">
          (couleur = profil · plein = ASAP · pointillé = prêt · opacité = ancienneté du snapshot)
        </span>
      </section>

      {/* Charts: each full-width, stacked. */}
      <section className="mb-8 flex flex-col gap-6">
        <figure className="rounded-lg border border-border bg-surface/40 p-3">
          <figcaption className="mb-1 text-sm font-semibold">
            Temps cumulé pour franchir chaque palier
          </figcaption>
          <LineChart
            series={timeSeries}
            width={1100}
            height={460}
            xLog={false}
            yLog
            xTickValues={eraTicks}
            fmtX={(v) => `e${Math.round(v)}`}
            fmtY={(v) => fmtDuration(v)}
            renderXTick={(v) => {
              const icon = ERA_ICON[Math.round(v)]
              return icon ? (
                <foreignObject x={-8} y={0} width={16} height={16}>
                  <Icon name={icon} className="h-4 w-4 text-muted" />
                </foreignObject>
              ) : null
            }}
          />
        </figure>
        <figure className="rounded-lg border border-border bg-surface/40 p-3">
          <figcaption className="mb-1 text-sm font-semibold">Complexité dans le temps</figcaption>
          <LineChart
            series={complexitySeries}
            width={1100}
            height={300}
            xLog
            yLog
            fmtX={(v) => fmtDuration(v)}
            fmtY={(v) => formatNumber(v)}
          />
        </figure>
      </section>

      {/* Summary comparison. */}
      <section className="mb-8 overflow-x-auto">
        <h2 className="mb-2 text-sm font-semibold tracking-wide text-muted uppercase">Synthèse</h2>
        <table className="w-full text-left text-sm">
          <thead className="text-xs text-muted">
            <tr className="border-b border-border">
              <th className="py-2 pr-4">Run</th>
              <th className="px-2">Snapshot</th>
              <th className="px-2">Ère atteinte</th>
              <th className="px-2">Temps total</th>
              <th className="px-2">Paliers franchis</th>
              <th className="px-2">Tout activé avant le suivant</th>
              <th className="px-2">Retours arrière</th>
            </tr>
          </thead>
          <tbody>
            {tableRuns.map((r, i) => {
              const left = r.milestones.filter((m) => m.completeness !== null)
              const full = left.filter((m) => m.completeness?.fullyActivated).length
              const partial = left.length - full
              const reached = r.milestones.filter((m) => m.unlockedAtS !== null).length - 1
              const backTrips = r.milestones.reduce((s, m) => s + m.backTrips, 0)
              const startsKind = i === 0 || runKey(tableRuns[i - 1]) !== runKey(r)
              return (
                <tr
                  key={uid(r)}
                  className={startsKind ? 'border-t-2 border-border' : 'border-t border-border/20'}
                >
                  <td className="py-2 pr-4 pl-2">
                    <span
                      aria-hidden
                      className="mr-2 inline-block h-0 w-5 border-t-2 align-middle"
                      style={{
                        borderColor: colorFor(r),
                        borderStyle: isDashed(r) ? 'dashed' : 'solid',
                        opacity: snapOpacity(r.runId),
                      }}
                    />
                    {r.profileLabel} <span className="text-muted">· {r.unlockPolicy}</span>
                  </td>
                  <td className="px-2 text-xs text-muted">{r.runLabel}</td>
                  <td className="px-2">
                    {r.milestones[r.finalEraIndex]?.eraName} (e{r.finalEraIndex})
                    {r.stuck ? <span className="ml-1 text-accent">mur</span> : null}
                  </td>
                  <td className="px-2 tabular-nums">{fmtDuration(r.totalTimeS)}</td>
                  <td className="px-2 tabular-nums">{reached}</td>
                  <td className="px-2 tabular-nums">
                    {full}/{left.length}
                    {partial > 0 ? <span className="ml-1 text-accent">⚠ {partial}</span> : null}
                  </td>
                  <td className="px-2 tabular-nums">{backTrips}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>

      {/* Per-era detail for one run. */}
      <section className="overflow-x-auto">
        <div className="mb-2 flex items-center gap-3">
          <h2 className="text-sm font-semibold tracking-wide text-muted uppercase">Détail par ère</h2>
          <select
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            className="rounded border border-border bg-surface px-2 py-1 text-sm"
          >
            {ALL_RUNS.map((r) => (
              <option key={uid(r)} value={uid(r)}>
                {r.profileLabel} · {r.unlockPolicy} · {r.runLabel}
              </option>
            ))}
          </select>
        </div>
        {detailRun ? (
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-muted">
              <tr className="border-b border-border">
                <th className="py-2 pr-4">Ère</th>
                <th className="px-2">Franchie à</th>
                <th className="px-2">Grind</th>
                <th className="px-2">Retours</th>
                <th className="px-2">Générateurs</th>
                <th className="px-2">Convertisseurs</th>
                <th className="px-2">Étapes complètes</th>
              </tr>
            </thead>
            <tbody>
              {detailRun.milestones
                .filter((m) => m.unlockedAtS !== null || m.completeness !== null)
                .map((m) => {
                  const c = m.completeness
                  const missing = c?.missing.map(machineName).join(', ')
                  return (
                    <tr key={m.eraId} className="border-b border-border/50">
                      <td className="py-2 pr-4">
                        {m.eraName} <span className="text-muted">e{m.eraIndex}</span>
                      </td>
                      <td className="px-2 tabular-nums">{fmtDuration(m.unlockedAtS)}</td>
                      <td className="px-2 tabular-nums">{fmtDuration(m.grindS)}</td>
                      <td className="px-2 tabular-nums">{m.backTrips}</td>
                      <td className="px-2 tabular-nums">
                        {c ? `${c.generators.active}/${c.generators.total}` : '-'}
                      </td>
                      <td className="px-2 tabular-nums">
                        {c ? `${c.converters.active}/${c.converters.total}` : '-'}
                      </td>
                      <td className="px-2" title={missing ? `Manque : ${missing}` : undefined}>
                        {!c ? (
                          '-'
                        ) : c.fullyActivated ? (
                          <span className="text-accent">✓</span>
                        ) : (
                          <span className="text-accent">⚠ incomplet</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        ) : null}
      </section>
    </main>
  )
}

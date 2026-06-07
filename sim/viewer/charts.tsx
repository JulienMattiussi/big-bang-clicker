import type { ReactElement } from 'react'

/** A lightweight SVG line chart (linear or log axes). No chart dependency. */
export interface LinePoint {
  x: number
  y: number
}
export interface LineSeries {
  key: string
  color: string
  dashed?: boolean
  points: LinePoint[]
}

interface Props {
  series: LineSeries[]
  width?: number
  height?: number
  xLog?: boolean
  yLog?: boolean
  fmtX?: (v: number) => string
  fmtY?: (v: number) => string
  /** Explicit x tick positions (e.g. one vertical line per era). */
  xTickValues?: number[]
}

const M = { top: 14, right: 16, bottom: 34, left: 64 }

function ticksFor(minV: number, maxV: number, log: boolean): number[] {
  if (log) {
    const lo = Math.floor(Math.log10(Math.max(minV, 1)))
    const hi = Math.ceil(Math.log10(Math.max(maxV, 10)))
    const out: number[] = []
    for (let e = lo; e <= hi; e++) out.push(10 ** e)
    return out
  }
  const out: number[] = []
  for (let i = 0; i <= 5; i++) out.push(minV + ((maxV - minV) * i) / 5)
  return out
}

export function LineChart({
  series,
  width = 720,
  height = 300,
  xLog = false,
  yLog = false,
  fmtX = (v) => `${v}`,
  fmtY = (v) => `${v}`,
  xTickValues,
}: Props): ReactElement {
  const pts = series.flatMap((s) => s.points)
  if (!pts.length) return <div className="p-4 text-sm text-muted">Aucune donnée</div>

  const X = (v: number) => (xLog ? Math.log10(Math.max(v, 1)) : v)
  const Y = (v: number) => (yLog ? Math.log10(Math.max(v, 1)) : v)

  const xsV = pts.map((p) => p.x)
  const ysV = pts.map((p) => p.y)
  const xMinV = Math.min(...xsV)
  const xMaxV = Math.max(...xsV)
  const yMinV = Math.min(...ysV)
  const yMaxV = Math.max(...ysV)

  const xMin = X(xMinV)
  const xMax = X(xMaxV)
  const yMin = Y(yLog ? 1 : yMinV)
  const yMax = Y(yMaxV)

  const px = (v: number) => M.left + ((X(v) - xMin) / (xMax - xMin || 1)) * (width - M.left - M.right)
  const py = (v: number) =>
    height - M.bottom - ((Y(v) - yMin) / (yMax - yMin || 1)) * (height - M.top - M.bottom)

  const xTicks = (xTickValues ?? ticksFor(xMinV, xMaxV, xLog)).filter(
    (v) => X(v) >= xMin - 1e-9 && X(v) <= xMax + 1e-9,
  )
  const yTicks = ticksFor(yLog ? 1 : yMinV, yMaxV, yLog).filter(
    (v) => Y(v) >= yMin - 1e-9 && Y(v) <= yMax + 1e-9,
  )

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full" role="img">
      {/* Gridlines + axis labels. */}
      {yTicks.map((v, i) => (
        <g key={`y${i}`}>
          <line x1={M.left} y1={py(v)} x2={width - M.right} y2={py(v)} stroke="var(--color-border)" strokeWidth="0.5" />
          <text x={M.left - 6} y={py(v)} textAnchor="end" dominantBaseline="central" className="fill-muted text-[10px]">
            {fmtY(v)}
          </text>
        </g>
      ))}
      {xTicks.map((v, i) => (
        <g key={`x${i}`}>
          <line x1={px(v)} y1={M.top} x2={px(v)} y2={height - M.bottom} stroke="var(--color-border)" strokeWidth="0.5" opacity="0.5" />
          <text x={px(v)} y={height - M.bottom + 14} textAnchor="middle" className="fill-muted text-[10px]">
            {fmtX(v)}
          </text>
        </g>
      ))}
      {/* Series. */}
      {series.map((s) =>
        s.points.length ? (
          <polyline
            key={s.key}
            fill="none"
            stroke={s.color}
            strokeWidth="1.8"
            strokeDasharray={s.dashed ? '5 4' : undefined}
            strokeLinejoin="round"
            points={s.points.map((p) => `${px(p.x)},${py(p.y)}`).join(' ')}
          />
        ) : null,
      )}
    </svg>
  )
}

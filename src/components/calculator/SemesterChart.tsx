import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { fmt } from '@/lib/copy'
import type { Results } from '@/lib/results'
import type { Semester } from '@/lib/state'

const HEIGHT = 300
const PAD = { top: 44, right: 16, bottom: 52, left: 48 }

/** Two-line column label from the study plan ("3rd year, 1st sem" becomes Y3 / S1), else from the term. */
function columnLabel(s: Semester): [string, string] {
  const m = s.yearLabel.match(/^(\d)\w* year, (1st sem|2nd sem|Midyear)/i)
  if (m) return [`Y${m[1]}`, m[2].toLowerCase() === 'midyear' ? 'Mid' : m[2].startsWith('1') ? 'S1' : 'S2']
  const yy = String((s.term === 1 ? s.ay : s.ay + 1) % 100).padStart(2, '0')
  return [s.term === 3 ? 'Mid' : s.term === 1 ? 'S1' : 'S2', `’${yy}`]
}

interface Column {
  label: [string, string]
  kind: 'past' | 'target' | 'planned'
  value: number | null
}

/** A y-range fitted to the data (lower GWA on top), so differences of a few hundredths are visible. */
function fitDomain(values: number[]): { lo: number; hi: number; step: number } {
  let lo = Math.max(1, Math.floor((Math.min(...values) - 0.08) * 20) / 20)
  let hi = Math.min(5, Math.ceil((Math.max(...values) + 0.08) * 20) / 20)
  if (hi - lo < 0.4) {
    const mid = (lo + hi) / 2
    lo = Math.max(1, mid - 0.2)
    hi = Math.min(5, lo + 0.4)
  }
  const step = [0.05, 0.1, 0.25, 0.5, 1].find((s) => (hi - lo) / s <= 5) ?? 1
  return { lo: Math.max(1, Math.floor(lo / step + 1e-9) * step), hi: Math.min(5, Math.ceil(hi / step - 1e-9) * step), step }
}

/**
 * One column per semester. Dots are the GWA you got; the maroon line across the semesters ahead
 * is the GWA to aim for, with its "or better" side shaded. Higher on the chart is better.
 */
export function SemesterChart({ res, seq }: { res: Results; seq: number }) {
  const box = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(640)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(300, entry.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const focus = res.focus
  const cols: Column[] = [
    ...res.done.map((d) => ({ label: columnLabel(d.semester), kind: 'past' as const, value: d.totals.gwa })),
    ...res.upcoming.map((u, i) => {
      const t = focus?.plan.semesters[i]
      return {
        label: columnLabel(u.semester),
        kind: t?.planned ? ('planned' as const) : ('target' as const),
        value: t && Number.isFinite(t.target) ? t.target : null,
      }
    }),
  ]
  const plottable = (v: number | null): v is number => v !== null && v >= 1 && v <= 5
  const values = cols.map((c) => c.value).filter(plottable)
  if (cols.length === 0 || values.length === 0) return null

  const { lo, hi, step } = fitDomain(values)
  const innerW = width - PAD.left - PAD.right
  const innerH = HEIGHT - PAD.top - PAD.bottom
  const colW = innerW / cols.length
  const cx = (i: number) => PAD.left + colW * (i + 0.5)
  const y = (v: number) => PAD.top + ((Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)) * innerH
  const base = PAD.top + innerH
  const ticks: number[] = []
  for (let t = lo; t <= hi + 1e-9; t += step) ticks.push(Math.round(t * 100) / 100)

  const pastCount = res.done.length
  const pastPts = cols
    .map((c, i) => (c.kind === 'past' && plottable(c.value) ? `${cx(i)},${y(c.value)}` : null))
    .filter((p): p is string => p !== null)
  const firstTarget = cols.findIndex((c) => c.kind === 'target' && plottable(c.value))
  const target = firstTarget >= 0 ? (cols[firstTarget].value as number) : null
  const small = colW < 40
  const d = { '--seq': seq } as CSSProperties

  const summary = cols
    .map((c) => {
      const name = c.label.join(' ')
      if (c.value === null) return `${name}: no grade yet`
      if (c.kind === 'past') return `${name}: got ${fmt.gwa(c.value)}`
      if (c.kind === 'planned') return `${name}: you plan ${fmt.grade(c.value)}`
      return c.value > 5 ? `${name}: any grade` : `${name}: need ${fmt.target(c.value)} or better`
    })
    .join('; ')

  return (
    <figure ref={box} className="w-full">
      <svg width={width} height={HEIGHT} role="img" aria-label={`Semester GWA chart, higher is better. ${summary}.`} className="block">
        {/* Semesters ahead sit on a light panel so "so far" and "ahead" read as two zones */}
        {pastCount < cols.length && (
          <rect x={PAD.left + colW * pastCount} y={PAD.top - 32} width={colW * (cols.length - pastCount)} height={innerH + 32} fill="var(--surface-alt)" />
        )}
        {pastCount > 0 && (
          <text x={PAD.left + 6} y={PAD.top - 14} className="fill-[var(--text-muted)] text-caption font-medium">
            So far
          </text>
        )}
        {pastCount < cols.length && (
          <text x={PAD.left + colW * pastCount + 8} y={PAD.top - 14} className="fill-[var(--text-muted)] text-caption font-medium">
            Ahead
          </text>
        )}

        {/* Grid: lower GWA is higher on the chart */}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke="var(--hairline)" />
            <text x={PAD.left - 10} y={y(t) + 4} textAnchor="end" className="fill-[var(--text-muted)] text-label tabular">
              {t.toFixed(2)}
            </text>
          </g>
        ))}

        {/* Target: one maroon line, its better side shaded */}
        <g className="seq-fade" style={d}>
          {cols.map((c, i) =>
            c.kind === 'target' && plottable(c.value) ? (
              <g key={`t${i}`}>
                <rect x={PAD.left + colW * i} y={PAD.top} width={colW} height={Math.max(0, y(c.value) - PAD.top)} fill="var(--maroon-tint)" />
                <line x1={PAD.left + colW * i} x2={PAD.left + colW * (i + 1)} y1={y(c.value)} y2={y(c.value)} stroke="var(--up-maroon)" strokeWidth={2.5} />
              </g>
            ) : null,
          )}
          {target !== null && (
            <text x={PAD.left + colW * firstTarget + 8} y={Math.min(base - 6, y(target) + 20)} className="fill-up-maroon text-caption font-semibold tabular">
              Aim for {fmt.target(target)} or better
            </text>
          )}
        </g>

        {/* Semesters done: dots joined by a trend line, each with its GWA */}
        {pastPts.length > 1 && (
          <polyline points={pastPts.join(' ')} fill="none" stroke="var(--up-black)" strokeWidth={1.5} pathLength={1} className="chart-line" style={d} />
        )}
        {cols.map((c, i) =>
          plottable(c.value) && c.kind !== 'target' ? (
            <g key={`p${i}`} className="seq-fade" style={d}>
              <circle cx={cx(i)} cy={y(c.value)} r={6} fill={c.kind === 'past' ? 'var(--up-black)' : 'var(--up-maroon)'} stroke="var(--bg)" strokeWidth={2} />
              <text
                x={cx(i)}
                y={y(c.value) - 12}
                textAnchor="middle"
                className={`${small ? 'text-label' : 'text-caption'} font-semibold tabular ${c.kind === 'past' ? 'fill-[var(--up-black)]' : 'fill-up-maroon'}`}
              >
                {fmt.grade(c.value)}
              </text>
            </g>
          ) : null,
        )}

        {/* Column labels: year on top, term below */}
        {cols.map((c, i) => (
          <g key={`l${i}`}>
            <text x={cx(i)} y={base + 22} textAnchor="middle" className={`fill-[var(--text)] ${small ? 'text-label' : 'text-caption'} font-medium`}>
              {c.label[0]}
            </text>
            <text x={cx(i)} y={base + 39} textAnchor="middle" className={`fill-[var(--text-muted)] ${small ? 'text-label' : 'text-caption'}`}>
              {c.label[1]}
            </text>
          </g>
        ))}
      </svg>

      <figcaption className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-caption text-muted-foreground">
        <span className="inline-flex items-center gap-2">
          <span aria-hidden className="size-2.5 rounded-full bg-up-black" /> Your semester GWA
        </span>
        {target !== null && (
          <span className="inline-flex items-center gap-2">
            <span aria-hidden className="h-[3px] w-5 rounded-full bg-up-maroon" /> GWA to aim for; the shaded side is better
          </span>
        )}
        {cols.some((c) => c.kind === 'planned') && (
          <span className="inline-flex items-center gap-2">
            <span aria-hidden className="size-2.5 rounded-full bg-up-maroon" /> Your what-if plan
          </span>
        )}
      </figcaption>
    </figure>
  )
}

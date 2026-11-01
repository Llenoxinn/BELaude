import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { fmt } from '@/lib/copy'
import type { Results } from '@/lib/results'
import { rules } from '@/lib/rules'
import { semesterLabel, type Semester } from '@/lib/state'

const HEIGHT = 360
// Left: the y-axis title and ticks. Right: direct labels for the cutoffs and the line's end.
const PAD = { top: 20, right: 116, bottom: 70, left: 68 }

/** Two-line column label from the study plan ("3rd year, 1st sem" becomes Y3 / S1), else from the term. */
function columnLabel(s: Semester): [string, string] {
  const m = s.yearLabel.match(/^(\d)\w* year, (1st sem|2nd sem|Midyear)/i)
  if (m) return [`Y${m[1]}`, m[2].toLowerCase() === 'midyear' ? 'Mid' : m[2].startsWith('1') ? 'S1' : 'S2']
  const yy = String((s.term === 1 ? s.ay : s.ay + 1) % 100).padStart(2, '0')
  return [s.term === 3 ? 'Mid' : s.term === 1 ? 'S1' : 'S2', `’${yy}`]
}

interface Column {
  label: [string, string]
  /** Full name for the tooltip and table, e.g. "1st sem, AY 2024–25 (2nd year, 1st sem)". */
  name: string
  kind: 'past' | 'target' | 'planned'
  /** Semester GWA: the one you got, the one you need, or the one you plan. */
  value: number | null
  /** Overall GWA after this semester: actual for semesters done, projected for the ones ahead. */
  overall: number | null
}

const fullName = (s: Semester) => (s.yearLabel ? `${semesterLabel(s)} (${s.yearLabel})` : semesterLabel(s))
const plottable = (v: number | null): v is number => v !== null && v >= 1 && v <= 5

/** A y-range fitted to the data (lower GWA on top), with round tick steps. */
function fitDomain(values: number[]): { lo: number; hi: number; step: number } {
  let lo = Math.max(1, Math.floor((Math.min(...values) - 0.05) * 20) / 20)
  let hi = Math.min(5, Math.ceil((Math.max(...values) + 0.05) * 20) / 20)
  if (hi - lo < 0.4) {
    const mid = (lo + hi) / 2
    lo = Math.max(1, mid - 0.2)
    hi = Math.min(5, lo + 0.4)
  }
  const step = [0.05, 0.1, 0.25, 0.5, 1].find((s) => (hi - lo) / s <= 6) ?? 1
  return { lo: Math.max(1, Math.floor(lo / step + 1e-9) * step), hi: Math.min(5, Math.ceil(hi / step - 1e-9) * step), step }
}

/**
 * Figure 1: semester GWA (points) and overall GWA (line) on one axis. Past semesters are solid;
 * the semesters ahead show the GWA you need (hollow points) and, dashed, where your overall GWA
 * goes if you get exactly that, ending on your goal's cutoff at graduation. Lower is better, so
 * 1.00 is at the top.
 */
export function SemesterChart({ res, seq }: { res: Results; seq: number }) {
  const box = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(640)
  useEffect(() => {
    const el = box.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(320, entry.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const [hover, setHover] = useState<number | null>(null)
  const narrow = width < 520
  const pad = narrow ? { top: 34, right: 60, bottom: 64, left: 40 } : PAD
  const focus = res.focus
  let points = 0
  let units = 0
  const past: Column[] = res.done.map((d) => {
    points += d.totals.points
    units += d.totals.units
    return { label: columnLabel(d.semester), name: fullName(d.semester), kind: 'past', value: d.totals.gwa, overall: units > 0 ? points / units : null }
  })
  // The projection starts from the record as computed (thesis S units included) and adds each semester ahead.
  let P = res.P
  let U = res.U
  let projecting = true
  const ahead: Column[] = res.upcoming.map((u, i) => {
    const t = focus?.plan.semesters[i]
    const value = t && Number.isFinite(t.target) ? t.target : null
    if (!plottable(value) || u.units <= 0) projecting = false
    let overall: number | null = null
    if (projecting && value !== null) {
      P += value * u.units
      U += u.units
      overall = P / U
    }
    return { label: columnLabel(u.semester), name: fullName(u.semester), kind: t?.planned ? 'planned' : 'target', value, overall }
  })
  const cols = [...past, ...ahead]
  const pastCount = past.length
  const values = cols.flatMap((c) => [c.value, c.overall]).filter(plottable)
  if (cols.length === 0 || values.length === 0) return null

  // Reference lines: the honors cutoffs near the data, the goal's always included
  const goal = focus?.tier
  const cutoffs = rules.latinHonors.filter(
    (t) => t.id === goal?.id || (t.maxGwa >= Math.min(...values) - 0.15 && t.maxGwa <= Math.max(...values) + 0.15),
  )
  const { lo, hi, step } = fitDomain([...values, ...cutoffs.map((t) => t.maxGwa)])
  const innerW = width - pad.left - pad.right
  const innerH = HEIGHT - pad.top - pad.bottom
  const colW = innerW / cols.length
  const cx = (i: number) => pad.left + colW * (i + 0.5)
  const y = (v: number) => pad.top + ((Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo)) * innerH
  const base = pad.top + innerH
  const ticks: number[] = []
  for (let t = lo; t <= hi + 1e-9; t += step) ticks.push(Math.round(t * 100) / 100)

  const line = (from: number, to: number) =>
    cols
      .slice(from, to)
      .map((c, k) => (plottable(c.overall) ? `${cx(from + k)},${y(c.overall)}` : null))
      .filter(Boolean)
      .join(' ')
  const lastPast = pastCount - 1
  const projected = ahead.some((c) => c.overall !== null)
  const lastIdx = cols.reduce((a, c, i) => (plottable(c.overall) ? i : a), -1)
  const endValue = lastIdx >= 0 ? cols[lastIdx].overall : null
  const small = colW < 44
  const d = { '--seq': seq } as CSSProperties

  return (
    <figure ref={box} className="relative w-full">
      <figcaption className="mb-4">
        <span className="block text-caption font-semibold">Figure 1</span>
        <span className="block text-body-sm text-muted-foreground">Semester GWA and overall GWA by semester{goal ? `, with the path to ${goal.short}` : ''}</span>
      </figcaption>

      {/* Legend: always present for two series, and each series is also told apart by its mark */}
      <ul className="mb-3 flex flex-wrap gap-x-6 gap-y-2 text-caption">
        <li className="inline-flex items-center gap-2">
          <svg aria-hidden width="14" height="14"><circle cx="7" cy="7" r="4.5" fill="var(--up-black)" /></svg>
          Semester GWA
        </li>
        {ahead.some((c) => c.kind === 'target' && plottable(c.value)) && (
          <li className="inline-flex items-center gap-2">
            <svg aria-hidden width="14" height="14"><circle cx="7" cy="7" r="4" fill="var(--bg)" stroke="var(--up-black)" strokeWidth="1.75" /></svg>
            Semester GWA needed
          </li>
        )}
        <li className="inline-flex items-center gap-2">
          <svg aria-hidden width="26" height="10"><line x1="0" x2="26" y1="5" y2="5" stroke="var(--up-maroon)" strokeWidth="2" /></svg>
          Overall GWA
        </li>
        {projected && (
          <li className="inline-flex items-center gap-2">
            <svg aria-hidden width="26" height="10"><line x1="0" x2="26" y1="5" y2="5" stroke="var(--up-maroon)" strokeWidth="2" strokeDasharray="5 4" /></svg>
            Overall GWA, projected
          </li>
        )}
      </ul>

      <svg width={width} height={HEIGHT} role="img" aria-labelledby="fig1-desc" className="block overflow-visible">
        <desc id="fig1-desc">
          Semester and overall GWA for each semester. Lower is better. The data is also in the table below the figure.
        </desc>

        {/* Grid and y-axis: recessive */}
        {ticks.map((t) => (
          <g key={t}>
            <line x1={pad.left} x2={width - pad.right} y1={y(t)} y2={y(t)} stroke="var(--hairline)" />
            <text x={pad.left - 10} y={y(t) + 4} textAnchor="end" className="fill-[var(--text-muted)] text-label tabular">
              {t.toFixed(2)}
            </text>
          </g>
        ))}
        {narrow ? (
          <text x={0} y={12} className="fill-[var(--text-muted)] text-label">
            GWA (1.00 is best)
          </text>
        ) : (
          <text transform={`translate(16 ${pad.top + innerH / 2}) rotate(-90)`} textAnchor="middle" className="fill-[var(--text-muted)] text-caption">
            GWA (1.00 is best)
          </text>
        )}

        {/* Honors cutoffs: reference lines, labelled in the right margin; the goal's in maroon */}
        {cutoffs.map((t) => {
          const isGoal = t.id === goal?.id
          return (
            <g key={t.id}>
              <line
                x1={pad.left}
                x2={width - pad.right}
                y1={y(t.maxGwa)}
                y2={y(t.maxGwa)}
                stroke={isGoal ? 'var(--up-maroon)' : 'var(--hairline-strong)'}
                strokeWidth={isGoal ? 1.25 : 1}
                strokeDasharray={isGoal ? undefined : '3 3'}
              />
              <text x={width - pad.right + 6} y={y(t.maxGwa) + (narrow ? -2 : 4)} className={`text-label tabular ${isGoal ? 'fill-up-maroon font-semibold' : 'fill-[var(--text-muted)]'}`}>
                {narrow ? (
                  <>
                    <tspan>{t.short}</tspan>
                    <tspan x={width - pad.right + 6} dy={12}>
                      {t.maxGwa.toFixed(2)}
                    </tspan>
                  </>
                ) : (
                  `${t.short} ${t.maxGwa.toFixed(2)}`
                )}
              </text>
            </g>
          )
        })}

        {/* Now: where the record ends and the plan begins */}
        {pastCount > 0 && pastCount < cols.length && (
          <g>
            <line x1={pad.left + colW * pastCount} x2={pad.left + colW * pastCount} y1={pad.top} y2={base} stroke="var(--text-faint)" strokeDasharray="2 3" />
            <text x={pad.left + colW * pastCount + 6} y={pad.top + 12} className="fill-[var(--text-muted)] text-label">
              Now
            </text>
          </g>
        )}

        {/* Overall GWA: solid for the record, dashed for the projection */}
        <g className="seq-fade" style={d}>
          {pastCount > 1 && <polyline points={line(0, pastCount)} fill="none" stroke="var(--up-maroon)" strokeWidth={2} />}
          {projected && (
            <polyline
              points={line(Math.max(0, lastPast), cols.length)}
              fill="none"
              stroke="var(--up-maroon)"
              strokeWidth={2}
              strokeDasharray="5 4"
            />
          )}
          {cols.map((c, i) =>
            plottable(c.overall) ? (
              <rect key={`o${i}`} x={cx(i) - 3.5} y={y(c.overall) - 3.5} width={7} height={7} fill="var(--up-maroon)" stroke="var(--bg)" strokeWidth={1.5} />
            ) : null,
          )}
          {endValue !== null && (
            <text x={width - pad.right + 6} y={y(endValue) + (narrow ? 26 : 18)} className="fill-up-maroon text-label font-semibold tabular">
              {narrow ? (
                <>
                  <tspan>Final</tspan>
                  <tspan x={width - pad.right + 6} dy={12}>
                    {fmt.gwa(endValue)}
                  </tspan>
                </>
              ) : (
                `Final ${fmt.gwa(endValue)}`
              )}
            </text>
          )}
        </g>

        {/* Semester GWA: filled for semesters done and plans, hollow for the GWA needed */}
        <g className="seq-fade" style={d}>
          {cols.map((c, i) =>
            plottable(c.value) ? (
              <g key={`p${i}`}>
                {c.kind === 'target' ? (
                  <circle cx={cx(i)} cy={y(c.value)} r={4.5} fill="var(--bg)" stroke="var(--up-black)" strokeWidth={1.75} />
                ) : (
                  <circle cx={cx(i)} cy={y(c.value)} r={4.5} fill="var(--up-black)" stroke="var(--bg)" strokeWidth={1.5} />
                )}
                {!small && (
                  <text x={cx(i)} y={y(c.value) - 10} textAnchor="middle" className="fill-[var(--up-black)] text-label tabular">
                    {c.kind === 'target' ? fmt.target(c.value) : fmt.grade(c.value)}
                  </text>
                )}
              </g>
            ) : null,
          )}
        </g>

        {/* x-axis */}
        <line x1={pad.left} x2={width - pad.right} y1={base} y2={base} stroke="var(--text-faint)" />
        {cols.map((c, i) => (
          <g key={`l${i}`}>
            <text x={cx(i)} y={base + 18} textAnchor="middle" className={`fill-[var(--text)] ${small ? 'text-label' : 'text-caption'}`}>
              {c.label[0]}
            </text>
            <text x={cx(i)} y={base + 33} textAnchor="middle" className="fill-[var(--text-muted)] text-label">
              {c.label[1]}
            </text>
          </g>
        ))}
        <text x={pad.left + innerW / 2} y={HEIGHT - 8} textAnchor="middle" className="fill-[var(--text-muted)] text-caption">
          Semester (year and term)
        </text>

        {/* Hover: the whole column is the target */}
        {cols.map((_, i) => (
          <g key={`h${i}`}>
            {hover === i && <rect x={pad.left + colW * i} y={pad.top} width={colW} height={innerH} fill="var(--text)" opacity={0.04} />}
            <rect
              x={pad.left + colW * i}
              y={pad.top}
              width={colW}
              height={innerH + 40}
              fill="transparent"
              onPointerEnter={() => setHover(i)}
              onPointerLeave={() => setHover((h) => (h === i ? null : h))}
            />
          </g>
        ))}
      </svg>

      {hover !== null && <Tooltip col={cols[hover]} left={cx(hover)} width={width} />}

      <p className="mt-3 max-w-[72ch] text-caption text-muted-foreground">
        <span className="font-medium text-foreground">How to read it.</span> Higher on the chart is better. Each point is one
        semester’s GWA; the line is your overall GWA after that semester.
        {projected && goal
          ? ` Right of “Now”, the hollow points are the semester GWA you need, and the dashed line is where your overall GWA goes if you get exactly that: it ends on the ${goal.short} cutoff at graduation. A semester needed above the cutoff line is fine, because your overall GWA is what counts.`
          : ''}
      </p>

      <details className="mt-3 text-caption">
        <summary className="inline-flex min-h-11 cursor-pointer items-center text-muted-foreground hover:text-foreground">Show the data as a table</summary>
        <table className="mt-1 w-full max-w-xl text-left tabular">
          <thead>
            <tr className="border-b border-border text-muted-foreground">
              <th scope="col" className="py-2 font-normal">Semester</th>
              <th scope="col" className="py-2 text-right font-normal">Semester GWA</th>
              <th scope="col" className="py-2 text-right font-normal">Overall GWA</th>
            </tr>
          </thead>
          <tbody>
            {cols.map((c, i) => (
              <tr key={i} className="border-b border-border">
                <td className="py-2">{c.name}</td>
                <td className="py-2 text-right">
                  {c.value === null ? '—' : c.kind === 'past' ? fmt.gwa(c.value) : c.kind === 'planned' ? `${fmt.grade(c.value)} (plan)` : c.value > 5 ? 'Any grade' : `${fmt.target(c.value)} needed`}
                </td>
                <td className="py-2 text-right">{c.overall === null ? '—' : `${fmt.gwa(c.overall)}${c.kind === 'past' ? '' : ' projected'}`}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  )
}

/** Per-semester detail on hover. Text stays in ink colours; the table below carries the same facts. */
function Tooltip({ col, left, width }: { col: Column; left: number; width: number }) {
  const lines: [string, string][] = []
  if (col.kind === 'past') {
    lines.push(['Semester GWA', col.value !== null ? fmt.gwa(col.value) : 'No grade yet'])
  } else if (col.kind === 'planned' && col.value !== null) {
    lines.push(['Your plan', fmt.grade(col.value)])
  } else if (col.value !== null) {
    lines.push(['Needed', col.value > 5 ? 'Any grade' : `${fmt.target(col.value)} or better`])
  }
  if (col.overall !== null) lines.push([col.kind === 'past' ? 'Overall after it' : 'Overall, projected', fmt.gwa(col.overall)])
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute top-16 z-10 w-56 rounded-lg border border-border bg-background px-3 py-2 text-caption"
      style={{ left: Math.max(0, Math.min(width - 224, left - 112)) }}
    >
      <p className="font-medium">{col.name}</p>
      {lines.map(([k, v]) => (
        <p key={k} className="mt-1 flex justify-between gap-3">
          <span className="text-muted-foreground">{k}</span>
          <span className="tabular">{v}</span>
        </p>
      ))}
    </div>
  )
}

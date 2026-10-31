import type { CSSProperties } from 'react'
import { fmt } from '@/lib/copy'
import { exampleGrades } from '@/lib/gwa'
import { rules, type TierId } from '@/lib/rules'
import { cn } from '@/lib/utils'

// Honors zones on a GWA scale. Lower is better, so the scale runs from 1.00 (left) upward.
const ZONE_BG: Record<TierId | 'none', string> = {
  summa: 'var(--zone-summa)',
  magna: 'var(--zone-magna)',
  cum: 'var(--zone-cum)',
  none: 'var(--zone-none)',
}

function zones(max: number) {
  let from = 1
  const list = rules.latinHonors.map((t) => {
    const z = { id: t.id as TierId | 'none', label: t.short, from, to: t.maxGwa }
    from = t.maxGwa
    return z
  })
  list.push({ id: 'none', label: 'No Latin honors', from, to: Math.max(max, from) })
  return list
}

function scaleMax(values: number[]): number {
  const top = Math.max(2, ...values.filter(Number.isFinite))
  return Math.min(5, Math.ceil((top + 0.1) * 4) / 4)
}

export interface ScaleMarker {
  value: number
  label: string
  tone: 'black' | 'green' | 'maroon' | 'gray'
}

const MARKER_COLOR: Record<ScaleMarker['tone'], string> = {
  black: 'var(--up-black)',
  green: 'var(--up-green)',
  maroon: 'var(--up-maroon)',
  gray: 'var(--text-faint)',
}

/**
 * Where you stand: the honors zones as a ruler, with your GWA now and possible final GWAs pinned
 * below it in separate lanes so labels never collide.
 */
export function GwaScale({ markers, focus }: { markers: ScaleMarker[]; focus?: TierId }) {
  const max = scaleMax(markers.map((m) => m.value))
  const pct = (v: number) => ((Math.min(max, Math.max(1, v)) - 1) / (max - 1)) * 100
  const ticks = [1, ...rules.latinHonors.map((t) => t.maxGwa), ...[2, 2.5, 3, 4, 5].filter((t) => t <= max)]
  const laneHeight = 44

  return (
    <figure className="w-full">
      <div className="mb-1.5 flex justify-between meta-label">
        <span>← Better</span>
        <span>Worse →</span>
      </div>
      <div className="relative h-5">
        {ticks.map((t) => (
          <span
            key={t}
            className="absolute top-0 -translate-x-1/2 tabular text-label text-muted-foreground first:translate-x-0"
            style={{ left: `${pct(t)}%` }}
          >
            {t.toFixed(2)}
          </span>
        ))}
      </div>
      <div className="relative flex h-11 overflow-hidden rounded-md">
        {zones(max).map((z) => {
          const width = pct(z.to) - pct(z.from)
          if (width <= 0) return null
          return (
            <div
              key={z.id}
              className={cn('flex items-center justify-center border-r border-white px-1 text-center', focus === z.id && 'ring-2 ring-up-maroon ring-inset')}
              style={{ width: `${width}%`, background: ZONE_BG[z.id] }}
            >
              <span
                className={cn(
                  'truncate text-label font-semibold',
                  z.id === 'none' ? 'text-muted-foreground' : 'text-up-green',
                  focus === z.id && 'text-up-maroon',
                  width < 13 && 'sr-only',
                )}
              >
                {z.label}
              </span>
            </div>
          )
        })}
      </div>
      <div className="relative" style={{ height: markers.length * laneHeight + 10 }}>
        {markers.map((m, i) => {
          const x = pct(m.value)
          const right = x > 55
          return (
            <div key={m.label} className="absolute top-0" style={{ left: `${x}%` }}>
              <span
                aria-hidden
                className="absolute -top-[22px] left-0 w-px -translate-x-1/2"
                style={{ height: 22 + i * laneHeight + 14, background: MARKER_COLOR[m.tone] }}
              />
              <span
                aria-hidden
                className="absolute -top-[27px] left-0 size-2.5 -translate-x-1/2 rounded-full border-2 border-white"
                style={{ background: MARKER_COLOR[m.tone] }}
              />
              <span
                className={cn('absolute whitespace-nowrap text-caption leading-tight', right ? '-translate-x-full pr-2 text-right' : 'pl-2')}
                style={{ top: i * laneHeight + 8 }}
              >
                <span className="block text-muted-foreground">{m.label}</span>
                <span className="tabular font-medium" style={{ color: m.tone === 'gray' ? undefined : MARKER_COLOR[m.tone] }}>
                  {fmt.gwa(m.value)}
                </span>
              </span>
            </div>
          )
        })}
      </div>
    </figure>
  )
}

/** A thin honors-zone track with one dot, for comparing scenarios at a glance. */
export function MiniScale({ value, max = 3 }: { value: number; max?: number }) {
  const pct = (v: number) => ((Math.min(max, Math.max(1, v)) - 1) / (max - 1)) * 100
  return (
    <div aria-hidden className="relative h-2 w-full">
      <div className="flex h-full overflow-hidden rounded-full">
        {zones(max).map((z) => (
          <div key={z.id} style={{ width: `${pct(z.to) - pct(z.from)}%`, background: ZONE_BG[z.id] }} />
        ))}
      </div>
      <span
        className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-up-black"
        style={{ left: `${pct(value)}%` }}
      />
    </div>
  )
}

/**
 * Why the target is what it is. A final GWA cutoff caps your total grade points
 * (cutoff x total units). What you have used so far leaves a budget for the units left.
 */
export function PointsBudget({
  tierName,
  cutoff,
  T,
  P,
  U,
  R,
  seq,
}: {
  tierName: string
  cutoff: number
  T: number
  P: number
  U: number
  R: number
  seq: number
}) {
  const cap = cutoff * T
  const left = cap - P
  const perUnit = left / R
  const usedPct = Math.min(100, (P / cap) * 100)
  return (
    <figure>
      <dl className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div>
          <dt className="meta-label">Points allowed in total</dt>
          <dd className="mt-1 tabular text-lg">{cap.toFixed(2)}</dd>
          <dd className="text-caption text-muted-foreground">
            {cutoff.toFixed(2)} × {fmt.units(T)} units
          </dd>
        </div>
        <div>
          <dt className="meta-label">Used so far</dt>
          <dd className="mt-1 tabular text-lg">{P.toFixed(2)}</dd>
          <dd className="text-caption text-muted-foreground">on {fmt.units(U)} units done</dd>
        </div>
        <div className="col-span-2 sm:col-span-1">
          <dt className="meta-label">Left for the rest</dt>
          <dd className="mt-1 tabular text-lg text-up-maroon">{left.toFixed(2)}</dd>
          <dd className="text-caption text-muted-foreground">for {fmt.units(R)} units to go</dd>
        </div>
      </dl>

      <div aria-hidden className="mt-5 flex h-9 w-full overflow-hidden rounded-md border border-border">
        <div className="seq-grow flex items-center bg-up-black px-2" style={{ width: `${usedPct}%`, ...({ '--seq': seq } as CSSProperties) }}>
          <span className="truncate text-label font-semibold text-white">Used</span>
        </div>
        <div className="flex flex-1 items-center bg-maroon-tint px-2">
          <span className="truncate text-label font-semibold text-up-maroon">Left: {left.toFixed(2)} points</span>
        </div>
      </div>

      <figcaption className="mt-4 max-w-[60ch] text-body-sm">
        <span className="tabular">
          {left.toFixed(2)} ÷ {fmt.units(R)} units = {perUnit.toFixed(4)}
        </span>
        . If every semester you have left averages that or better, your final GWA lands at {cutoff.toFixed(2)} or better, which is{' '}
        {tierName}.
      </figcaption>
    </figure>
  )
}

/** What a target looks like as real grades: a 6-course semester (equal units) that meets it. */
export function ExampleSemester({ target }: { target: number }) {
  const grades = exampleGrades(target)
  if (!grades || target > 5) return null
  const avg = grades.reduce((a, b) => a + b, 0) / grades.length
  const best = Math.min(...grades)
  return (
    <figure className="mt-5">
      <figcaption className="meta-label">Example: one semester of 6 courses that works</figcaption>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {grades.map((g, i) => (
          <span
            key={i}
            className={cn(
              'inline-flex h-9 min-w-12 items-center justify-center rounded-md border px-2 tabular text-sm',
              g === best ? 'border-up-green/30 bg-green-tint text-up-green' : 'border-border bg-background',
            )}
          >
            {fmt.grade(g)}
          </span>
        ))}
        <span className="ml-1 tabular text-sm text-muted-foreground">= {avg.toFixed(4)} average</span>
      </div>
    </figure>
  )
}

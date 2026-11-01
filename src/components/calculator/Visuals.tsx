import type { CSSProperties } from 'react'
import { fmt } from '@/lib/copy'
import { exampleGrades, tierForGwa } from '@/lib/gwa'
import { rules, type TierId } from '@/lib/rules'
import { cn } from '@/lib/utils'

// Honors zones on a GWA scale. Lower is better, so the scale runs from 1.00 (left) upward.
const ZONE_INK: Record<TierId | 'none', string> = {
  summa: 'text-gold-ink',
  magna: 'text-green-ink',
  cum: 'text-maroon-ink',
  none: 'text-muted-foreground',
}

const TAG: Record<TierId, string> = {
  summa: 'bg-gold-tint text-gold-ink',
  magna: 'bg-green-tint text-green-ink',
  cum: 'bg-maroon-tint text-maroon-ink',
}

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

const MARKER_SHAPE: Record<ScaleMarker['tone'], string> = {
  black: 'bg-up-black',
  green: 'bg-up-black',
  maroon: 'bg-up-maroon',
  gray: 'border-2 border-up-black bg-background',
}

/**
 * Figure 2, a forest plot of final GWA: one row per estimate (so equal values never hide each
 * other), the achievable range as an interval, the honors ranges as bands behind every row and
 * the cutoffs as lines. Lower is better, so 1.00 is on the left.
 */
export function GwaScale({ markers, range, focus }: { markers: ScaleMarker[]; range?: { best: number; worst: number }; focus?: TierId }) {
  const all = [...markers.map((m) => m.value), ...(range ? [range.best, range.worst] : [])]
  const max = scaleMax(all)
  const pct = (v: number) => ((Math.min(max, Math.max(1, v)) - 1) / (max - 1)) * 100
  const ticks: number[] = []
  for (let t = 1; t <= max + 1e-9; t += 0.25) ticks.push(Math.round(t * 100) / 100)
  const goal = rules.latinHonors.find((t) => t.id === focus)

  const Bands = () => (
    <>
      {zones(max).map((z) => {
        const width = pct(z.to) - pct(z.from)
        return width > 0 ? (
          <span key={z.id} aria-hidden className="absolute inset-y-0" style={{ left: `${pct(z.from)}%`, width: `${width}%`, background: z.id === 'none' ? 'transparent' : ZONE_BG[z.id] }} />
        ) : null
      })}
      {rules.latinHonors.map((t) => (
        <span
          key={t.id}
          aria-hidden
          className={cn('absolute inset-y-0 w-0 border-l', t.id === goal?.id ? 'border-up-maroon' : 'border-dashed border-[var(--hairline-strong)]')}
          style={{ left: `${pct(t.maxGwa)}%` }}
        />
      ))}
    </>
  )
  const row = 'grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 md:grid-cols-[minmax(0,12rem)_minmax(0,1fr)_9rem]'
  const plotCell = 'col-span-2 row-start-2 md:col-span-1 md:col-start-2 md:row-start-1'
  const valueCell = 'col-start-2 row-start-1 md:col-start-3'

  return (
    <figure className="w-full">
      <figcaption className="mb-4">
        <span className="block text-caption font-semibold">Figure 2</span>
        <span className="block text-body-sm text-muted-foreground">Your final GWA at graduation: where you are, where you are headed, and what is still possible</span>
      </figcaption>

      {/* Region names over the plot */}
      <div className={row}>
        <span className="hidden md:block" />
        <div className={cn('relative h-6', plotCell, 'row-start-1')}>
          {zones(max).map((z) => {
            const width = pct(z.to) - pct(z.from)
            if (width < 4) return null
            return (
              <span
                key={z.id}
                className={cn('absolute -translate-x-1/2 whitespace-nowrap text-label font-medium', ZONE_INK[z.id])}
                style={{ left: `${pct((z.from + z.to) / 2)}%` }}
              >
                {z.id === 'none' ? 'No honors' : z.label}
              </span>
            )
          })}
        </div>
        <span className="hidden text-right text-label text-muted-foreground md:block">Final GWA</span>
      </div>

      <ul>
        {range && (
          <li className={row}>
            <span className="pt-3 text-body-sm md:py-3">Possible final GWA</span>
            <div className={cn('relative h-10 md:h-12', plotCell)}>
              <Bands />
              <span aria-hidden className="absolute top-1/2 h-0.5 -translate-y-1/2 bg-up-black" style={{ left: `${pct(range.best)}%`, width: `${pct(range.worst) - pct(range.best)}%` }} />
              <span aria-hidden className="absolute top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-up-black" style={{ left: `${pct(range.best)}%` }} />
              <span aria-hidden className="absolute top-1/2 h-3 w-0.5 -translate-x-1/2 -translate-y-1/2 bg-up-black" style={{ left: `${pct(range.worst)}%` }} />
            </div>
            <span className={cn('pt-3 text-right text-body-sm tabular md:pt-0', valueCell)}>
              {fmt.gwa(range.best)}–{fmt.gwa(range.worst)}
            </span>
          </li>
        )}
        {markers.map((m) => {
          const tier = tierForGwa(m.value)
          return (
            <li key={m.label} className={row}>
              <span className="pt-3 text-body-sm md:py-3">{m.label}</span>
              <div className={cn('relative h-10 md:h-12', plotCell)}>
                <Bands />
                <span aria-hidden className={cn('absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full', MARKER_SHAPE[m.tone])} style={{ left: `${pct(m.value)}%` }} />
              </div>
              <span className={cn('flex items-center justify-end gap-2 pt-3 text-body-sm md:pt-0', valueCell)}>
                <span className="tabular font-medium">{fmt.gwa(m.value)}</span>
                <span className={cn('hidden rounded-full px-2 py-0.5 text-label font-medium sm:inline', tier ? TAG[tier.id] : 'bg-neutral-tint text-muted-foreground')}>
                  {tier ? tier.short : 'None'}
                </span>
              </span>
            </li>
          )
        })}
      </ul>

      {/* x-axis */}
      <div className={row}>
        <span className="hidden md:block" />
        <div className={cn('relative h-8 border-t border-[var(--text-faint)]', plotCell, 'row-start-1')}>
          {ticks.map((t, i) => (
            <span key={t} className="absolute top-0 flex flex-col items-center" style={{ left: `${pct(t)}%`, transform: 'translateX(-50%)' }}>
              <span aria-hidden className="h-1.5 w-px bg-[var(--text-faint)]" />
              <span className={cn('mt-1 text-label tabular text-muted-foreground', i % 2 === 1 && 'max-sm:hidden')}>{t.toFixed(2)}</span>
            </span>
          ))}
        </div>
        <span className="hidden md:block" />
      </div>
      <div className={row}>
        <span className="hidden md:block" />
        <p className={cn('mt-1 text-center text-caption text-muted-foreground', plotCell, 'row-start-1')}>Final GWA (lower is better)</p>
        <span className="hidden md:block" />
      </div>

      <p className="mt-4 max-w-[72ch] text-caption text-muted-foreground">
        <span className="font-medium text-foreground">How to read it.</span> Further left is better. The shaded areas are the
        Latin honors ranges{goal ? `, and the maroon line is the ${goal.short} cutoff` : ''}.
        {range ? ' The black interval runs from your best possible finish (every remaining grade 1.00) to your worst passing one (every remaining grade 3.00).' : ''}
      </p>
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
  // Round ticks along the axis, then the cap itself at the end
  const stepPts = [10, 25, 50, 100, 250].find((s) => cap / s <= 6) ?? 500
  const axisTicks = [...Array.from({ length: Math.floor(cap / stepPts) + 1 }, (_, i) => i * stepPts).filter((t) => t < cap - stepPts * 0.4), cap]
  return (
    <figure>
      <p className="mb-4">
        <span className="block text-caption font-semibold">Figure 3</span>
        <span className="block text-body-sm text-muted-foreground">The grade points {tierName} allows, used and left</span>
      </p>
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

      {/* The bar on a grade-point axis: what is used, what is left, and the cap at its end */}
      <div className="mt-8">
        <div aria-hidden className="flex h-10 w-full gap-0.5">
          <div className="seq-grow flex items-center rounded-l-md bg-up-black px-3" style={{ width: `${usedPct}%`, ...({ '--seq': seq } as CSSProperties) }}>
            <span className="truncate text-label font-semibold text-white">Used {P.toFixed(2)}</span>
          </div>
          <div className="flex flex-1 items-center rounded-r-md bg-maroon-tint px-3">
            <span className="truncate text-label font-semibold text-maroon-ink">Left {left.toFixed(2)}</span>
          </div>
        </div>
        <div aria-hidden className="relative h-8 border-t border-[var(--text-faint)]">
          {axisTicks.map((t) => (
            <span key={t} className="absolute top-0 flex flex-col items-center" style={{ left: `${(t / cap) * 100}%`, transform: t === 0 ? 'none' : t >= cap ? 'translateX(-100%)' : 'translateX(-50%)' }}>
              <span className="h-1.5 w-px bg-[var(--text-faint)]" />
              <span className="mt-1 text-label tabular text-muted-foreground">{t === cap ? `${cap.toFixed(2)} cap` : t}</span>
            </span>
          ))}
        </div>
        <p aria-hidden className="text-center text-caption text-muted-foreground">Grade points (grade × units)</p>
      </div>

      <figcaption className="mt-5 max-w-[72ch] text-body-sm">
        <span className="tabular">
          {left.toFixed(2)} points ÷ {fmt.units(R)} units = {perUnit.toFixed(4)}
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

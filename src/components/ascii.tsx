import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { DISK_CENTRE, GROWTH, LAUREL_LEFT, LAUREL_RIGHT, SUNFLOWER, TOWER, type ArtFrame } from './art'
import { useInView, useMotion } from '@/lib/motion'
import { cn } from '@/lib/utils'

// Braille dot art (design.md 2c): petals gold, seed disk maroon, stem and leaves green.
const TONE: Record<string, string> = {
  y: 'text-art-gold',
  m: 'text-up-maroon',
  g: 'text-up-green',
  s: 'text-muted-foreground',
  k: 'text-up-black',
}

function paintLine(line: string, tone: string): ReactNode {
  const runs: { cls: string; text: string }[] = []
  Array.from(line).forEach((ch, i) => {
    const cls = TONE[tone[i]] ?? ''
    const last = runs[runs.length - 1]
    if (last && last.cls === cls) last.text += ch
    else runs.push({ cls, text: ch })
  })
  return runs.map((r, i) =>
    r.cls ? (
      <span key={i} className={r.cls}>
        {r.text}
      </span>
    ) : (
      r.text
    ),
  )
}

export function BrailleArt({ frame, className, lineStyle }: { frame: ArtFrame; className?: string; lineStyle?: (row: number) => CSSProperties }) {
  return (
    <pre aria-hidden className={cn('braille', className)}>
      {frame.lines.map((line, r) => (
        <span key={r} className="block" style={lineStyle?.(r)}>
          {paintLine(line, frame.tone[r])}
        </span>
      ))}
    </pre>
  )
}

/** Hero sunflower with a GWA in its seed disk. Sways slowly; the number rolls in once. */
export function FaceSunflower({ value, className }: { value: number; className?: string }) {
  const shown = useRolling(value, 700, 400)
  return (
    <div className={cn('sway relative inline-block', className)}>
      <BrailleArt frame={SUNFLOWER} className="text-[7.5px] sm:text-label lg:text-caption" />
      <span
        aria-hidden
        className="absolute -translate-x-1/2 -translate-y-1/2 font-serif text-[1.375rem] text-up-maroon tabular sm:text-[1.75rem]"
        style={{ left: `${(DISK_CENTRE.col / DISK_CENTRE.cols) * 100}%`, top: `${(DISK_CENTRE.row / DISK_CENTRE.rows) * 100}%` }}
      >
        {shown.toFixed(2)}
      </span>
    </div>
  )
}

/** Final growth frame for each stage: seedling, young plant, opening, bloom (by quarter of units done). */
function growthFrame(progress: number): number {
  if (progress < 0.25) return 0
  if (progress < 0.5) return 1
  if (progress < 0.75) return 2
  return GROWTH.length - 1
}

export function stageName(progress: number): string {
  return ['a seedling', 'growing', 'opening', 'in bloom'][Math.min(3, Math.floor(Math.max(0, progress) * 4))]
}

/**
 * The progress sunflower: grows frame by frame from a seedling to the stage matching units done,
 * then rests. Regrows only when the stage changes.
 */
export function GrowthSunflower({
  progress,
  label,
  delay = 0,
  skip = false,
  stillGrowing = false,
  className,
}: {
  progress: number
  label: string
  delay?: number
  skip?: boolean
  stillGrowing?: boolean
  className?: string
}) {
  const { reduced } = useMotion()
  const target = stillGrowing ? GROWTH.length - 1 : growthFrame(progress)
  const [frame, setFrame] = useState(reduced || skip ? target : 0)

  useEffect(() => {
    if (reduced || skip) {
      setFrame(target)
      return
    }
    let current = 0
    setFrame(0)
    let timer = window.setTimeout(function step() {
      if (current >= target) return
      current += 1
      setFrame(current)
      timer = window.setTimeout(step, 250)
    }, delay)
    return () => window.clearTimeout(timer)
  }, [target, reduced, skip, delay])

  return (
    <div role="img" aria-label={label} className={cn('inline-block', className)}>
      <div className={cn(stillGrowing && 'ambient still-growing')}>
        <BrailleArt frame={GROWTH[frame]} className="text-[6px] md:text-[7px]" />
      </div>
    </div>
  )
}

/** Footer scene in Braille dots (bell tower between two sunflowers), built line by line from the ground up. */
export function Tower({ className }: { className?: string }) {
  const [ref, inView] = useInView<HTMLDivElement>()
  return (
    <div ref={ref} data-inview={inView} className={cn('build', className)}>
      <BrailleArt frame={TOWER} className="text-[7px] sm:text-[8px]" lineStyle={(r) => ({ '--line': TOWER.lines.length - 1 - r }) as CSSProperties} />
    </div>
  )
}

/** Two laurel sprigs framing a tier name; they slide in from both sides. */
export function Laurel({ children, active }: { children: ReactNode; active: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {active && (
        <pre aria-hidden className="braille laurel-left text-[6px] text-up-green">
          {LAUREL_LEFT.join('\n')}
        </pre>
      )}
      {children}
      {active && (
        <pre aria-hidden className="braille laurel-right text-[6px] text-up-green">
          {LAUREL_RIGHT.join('\n')}
        </pre>
      )}
    </span>
  )
}

/**
 * Rolls a number in from 0 on first appearance. Later changes (typing a what-if) update
 * instantly: frequent, user-driven changes get no animation. Instant under reduced motion.
 */
export function useRolling(value: number, duration = 700, delay = 0, skip = false): number {
  const { reduced } = useMotion()
  const [shown, setShown] = useState(reduced || skip ? value : 0)
  const from = useRef(reduced || skip ? value : 0)
  const played = useRef(false)

  useEffect(() => {
    if (reduced || skip || played.current || !Number.isFinite(value)) {
      setShown(value)
      from.current = value
      return
    }
    played.current = true
    const start = from.current
    let raf = 0
    let t0 = 0
    const timer = window.setTimeout(() => {
      const tick = (t: number) => {
        if (!t0) t0 = t
        const k = Math.min(1, (t - t0) / duration)
        const eased = 1 - Math.pow(1 - k, 4)
        setShown(start + (value - start) * eased)
        if (k < 1) raf = requestAnimationFrame(tick)
        else from.current = value
      }
      raf = requestAnimationFrame(tick)
    }, delay)
    return () => {
      window.clearTimeout(timer)
      cancelAnimationFrame(raf)
    }
  }, [value, duration, delay, reduced, skip])

  return shown
}

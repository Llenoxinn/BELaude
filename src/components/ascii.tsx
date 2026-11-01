import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { DISK_CENTRE, GROWTH, LAUREL_LEFT, LAUREL_RIGHT, SUNFLOWER, type ArtFrame } from './art'
import { CAMPUS, CAMPUS_SIZE } from './campus'
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

/** The drawing leaves the seed disk hollow; the hero fills it with maroon seed dots in a woven pattern. */
const SEEDED: ArtFrame = (() => {
  const seed = ['⢕', '⡪']
  const inDisk = (r: number, c: number) => ((r - DISK_CENTRE.row) / 3.6) ** 2 + ((c - DISK_CENTRE.col) / 9.5) ** 2 <= 1
  const lines: string[] = []
  const tone: string[] = []
  SUNFLOWER.lines.forEach((line, r) => {
    const chars = Array.from(line)
    const tones = Array.from(SUNFLOWER.tone[r].padEnd(chars.length))
    chars.forEach((ch, c) => {
      if (ch === '⠀' && inDisk(r, c)) {
        chars[c] = seed[(r + c) % 2]
        tones[c] = 'm'
      }
    })
    lines.push(chars.join(''))
    tone.push(tones.join(''))
  })
  return { lines, tone }
})()

/** Hero sunflower with a seeded disk. Sways once, slowly, then rests. */
export function HeroSunflower({ className }: { className?: string }) {
  return (
    <div className={cn('sway inline-block', className)}>
      <BrailleArt frame={SEEDED} className="text-[7.5px] sm:text-label lg:text-caption" />
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

// ---------- footer campus scene ----------

const { cols: COLS, rows: ROWS } = CAMPUS_SIZE
const BLANK = new Uint8Array(COLS * ROWS)
const FRAMES = CAMPUS.map((f) => Uint8Array.from(f.lines.join(''), (ch) => ch.charCodeAt(0) - 0x2800))
// Position of each of the 8 dots inside a Braille cell, by bit.
const DOT = [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [0, 3], [1, 3]]
const DEVELOP_MS = 2200
const SWAP_MS = 1800
const HOLD_MS = 6000

/**
 * The moment each dot flips during a transition, 0..1: mostly the sweep position, plus grain so
 * the front edge dissolves instead of wiping. Seeded so it looks the same on every visit.
 */
function dotOrder(sweep: (x: number, y: number) => number): Float32Array {
  let seed = 0x9e3779b9
  const rand = () => {
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const order = new Float32Array(COLS * ROWS * 8)
  for (let r = 0; r < ROWS; r++)
    for (let c = 0; c < COLS; c++)
      DOT.forEach(([dx, dy], b) => {
        order[(r * COLS + c) * 8 + b] = 0.7 * sweep((c * 2 + dx) / (COLS * 2 - 1), (r * 4 + dy) / (ROWS * 4 - 1)) + 0.3 * rand()
      })
  return order
}
const RISE = dotOrder((_, y) => 1 - y) // first view: develops from the ground up
const WIPE = dotOrder((x) => x) // later swaps: left to right

function mix(from: Uint8Array, to: Uint8Array, order: Float32Array, t: number): string {
  const lines: string[] = []
  const codes = new Array<number>(COLS)
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      const i = r * COLS + c
      let code = 0
      for (let b = 0; b < 8; b++) code |= (order[i * 8 + b] < t ? to[i] : from[i]) & (1 << b)
      codes[c] = 0x2800 + code
    }
    lines.push(String.fromCharCode(...codes))
  }
  return lines.join('\n')
}

const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2)

/**
 * Footer scene: the two campus photos in Braille dots. Develops from the ground up on first view,
 * then trades one photo for the other dot by dot. Writes text straight to the <pre> each frame
 * (no React renders). Pauses off screen and in hidden tabs; holds still under reduced motion.
 */
export function CampusScene({ className }: { className?: string }) {
  const { reduced } = useMotion()
  const [ref, inView] = useInView<HTMLDivElement>(false, '0px')
  const pre = useRef<HTMLPreElement>(null)
  const state = useRef({ frame: 0, phase: 'develop' as 'develop' | 'hold' | 'swap', elapsed: 0 })

  useLayoutEffect(() => {
    if (pre.current) pre.current.textContent = mix(BLANK, FRAMES[0], RISE, reduced ? 1 : 0)
    // Only the first paint: later states are drawn by the effect below.
  }, [])

  useEffect(() => {
    const el = pre.current
    const s = state.current
    if (!el) return
    if (reduced) {
      if (s.phase !== 'hold') Object.assign(s, { phase: 'hold', elapsed: 0 })
      el.textContent = mix(FRAMES[s.frame], FRAMES[s.frame], WIPE, 1)
      return
    }
    if (!inView) return

    let raf = 0
    let last = 0
    const tick = (now: number) => {
      // Clamp the step so a backgrounded tab resumes where it left off instead of jumping.
      s.elapsed += last ? Math.min(now - last, 50) : 0
      last = now
      if (s.phase === 'hold') {
        if (s.elapsed < HOLD_MS) {
          raf = requestAnimationFrame(tick)
          return
        }
        Object.assign(s, { phase: 'swap', elapsed: 0 })
      }
      const developing = s.phase === 'develop'
      const k = Math.min(1, s.elapsed / (developing ? DEVELOP_MS : SWAP_MS))
      const next = developing ? 0 : (s.frame + 1) % FRAMES.length
      el.textContent = developing ? mix(BLANK, FRAMES[0], RISE, easeInOut(k)) : mix(FRAMES[s.frame], FRAMES[next], WIPE, easeInOut(k))
      if (k >= 1) Object.assign(s, { frame: next, phase: 'hold', elapsed: 0 })
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, reduced])

  return (
    <div ref={ref} role="img" aria-label="UP Cebu drawn in Braille dots: the Oblation, then the Administration Building" className={cn('@container flex justify-center overflow-hidden', className)}>
      <pre ref={pre} aria-hidden className="braille campus-scene" />
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

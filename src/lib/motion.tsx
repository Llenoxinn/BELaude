import { createContext, useContext, useEffect, useRef, useState, type CSSProperties, type ElementType, type ReactNode } from 'react'
import { cn } from './utils'

const PREF_KEY = 'belaude:reduce-motion'

interface MotionValue {
  /** True when motion is off, from the OS setting or the footer toggle. */
  reduced: boolean
  /** The footer toggle: null follows the OS. */
  preference: boolean | null
  setPreference: (value: boolean | null) => void
}

const MotionContext = createContext<MotionValue>({ reduced: false, preference: null, setPreference: () => {} })

function readPreference(): boolean | null {
  try {
    const v = localStorage.getItem(PREF_KEY)
    return v === null ? null : v === 'true'
  } catch {
    return null
  }
}

export function MotionProvider({ children }: { children: ReactNode }) {
  const [osReduced, setOsReduced] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  const [preference, setPreferenceState] = useState<boolean | null>(readPreference)
  const reduced = preference ?? osReduced

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const onChange = () => setOsReduced(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  useEffect(() => {
    document.documentElement.dataset.motion = reduced ? 'reduce' : 'full'
  }, [reduced])

  // Pause ambient animation while the tab is hidden.
  useEffect(() => {
    const onVisibility = () => {
      document.documentElement.dataset.hidden = String(document.visibilityState === 'hidden')
    }
    onVisibility()
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  const setPreference = (value: boolean | null) => {
    setPreferenceState(value)
    try {
      if (value === null) localStorage.removeItem(PREF_KEY)
      else localStorage.setItem(PREF_KEY, String(value))
    } catch {
      // storage blocked: the toggle still works for this visit
    }
  }

  return <MotionContext.Provider value={{ reduced, preference, setPreference }}>{children}</MotionContext.Provider>
}

export function useMotion() {
  return useContext(MotionContext)
}

/** Tracks whether an element is on screen. With `once`, stays true after the first sighting. */
export function useInView<T extends Element>(once = true, rootMargin = '0px 0px -10% 0px') {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting)
        if (entry.isIntersecting && once) io.disconnect()
      },
      { rootMargin },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [once, rootMargin])
  return [ref, inView] as const
}

/** Fades a section up once when it scrolls into view. `index` staggers siblings. */
export function Reveal({
  as: Tag = 'div',
  index = 0,
  className,
  children,
  ...rest
}: { as?: ElementType; index?: number; className?: string; children: ReactNode } & Record<string, unknown>) {
  const [ref, inView] = useInView<HTMLElement>()
  return (
    <Tag ref={ref} className={cn('reveal', inView && 'is-visible', className)} style={{ '--i': index } as CSSProperties} {...rest}>
      {children}
    </Tag>
  )
}

/** Wraps ambient ASCII art so its animation pauses when off screen. */
export function Ambient({ className, children }: { className?: string; children: ReactNode }) {
  const [ref, inView] = useInView<HTMLDivElement>(false, '0px')
  return (
    <div ref={ref} className={cn('ambient', className)} data-offscreen={!inView}>
      {children}
    </div>
  )
}

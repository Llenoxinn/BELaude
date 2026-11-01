import { useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react'
import { LogoMark } from '@/components/LogoMark'
import { useMotion } from '@/lib/motion'

const SEEN = 'belaude:intro'

function seen(): boolean {
  try {
    return sessionStorage.getItem(SEEN) === '1'
  } catch {
    return false
  }
}

/** One word inside its mask: it rises in (and maybe out) through the line it sits on. */
function Word({ children, inAt, outAt, className }: { children: string; inAt: number; outAt?: number; className?: string }) {
  const animation = [`intro-rise 560ms var(--ease-out) ${inAt}ms both`, outAt !== undefined && `intro-drop 420ms var(--ease-in-out) ${outAt}ms forwards`]
    .filter(Boolean)
    .join(', ')
  return (
    <span className={`intro-mask ${className ?? ''}`}>
      <span className="intro-word" style={{ animation }}>
        {children}
      </span>
    </span>
  )
}

/**
 * First-load intro, the name's own pun: "Be Loud", then "Be a Laude" ("Be" stays, "Loud" drops out),
 * then the "a" folds away and "Laude" slides over to meet "Be", and the sunflower rolls in as the
 * transition, wiping the sentence into the BELaude wordmark. Once per session, skipped by any click or key, never shown with
 * reduced motion. Decorative: the page is already rendered underneath and screen readers skip it.
 */
export function Intro() {
  const { reduced } = useMotion()
  const [show, setShow] = useState(() => !reduced && !seen())
  const be = useRef<HTMLSpanElement>(null)
  const laude = useRef<HTMLSpanElement>(null)
  const flower = useRef<HTMLSpanElement>(null)
  const name = useRef<HTMLSpanElement>(null)
  const [join, setJoin] = useState(0)
  const [swirl, setSwirl] = useState(0)

  // Measured, so the choreography holds at every screen width: how far "Laude" slides to meet "Be",
  // and how far the flower rolls (from the name's right edge to its resting place) so it rides the wipe
  useLayoutEffect(() => {
    if (!show || !be.current || !laude.current || !flower.current || !name.current) return
    const measure = () => {
      setJoin(laude.current!.offsetLeft - (be.current!.offsetLeft + be.current!.offsetWidth))
      setSwirl(name.current!.offsetLeft + name.current!.offsetWidth - (flower.current!.offsetLeft + flower.current!.offsetWidth / 2))
    }
    measure()
    document.fonts?.ready.then(measure)
  }, [show])

  useEffect(() => {
    if (!show) return
    const done = () => {
      try {
        sessionStorage.setItem(SEEN, '1')
      } catch {
        // storage blocked: it simply plays again next visit
      }
      setShow(false)
    }
    // A safety net in case animationend never fires (a backgrounded tab, an interrupted animation)
    const t = window.setTimeout(done, 5700)
    window.addEventListener('pointerdown', done, { once: true })
    window.addEventListener('keydown', done, { once: true })
    const el = document.getElementById('intro')
    const onEnd = (e: AnimationEvent) => e.animationName === 'intro-out' && done()
    el?.addEventListener('animationend', onEnd)
    return () => {
      window.clearTimeout(t)
      window.removeEventListener('pointerdown', done)
      window.removeEventListener('keydown', done)
      el?.removeEventListener('animationend', onEnd)
    }
  }, [show])

  if (!show || reduced) return null
  return (
    <div id="intro" aria-hidden className="intro fixed inset-0 z-[100] grid place-items-center overflow-hidden bg-background px-6">
      {/* The sentence: left-aligned, so "Be" never moves while the words around it change */}
      <p
        className="intro-line col-start-1 row-start-1 text-[clamp(2.75rem,11vw,6rem)] leading-none font-semibold tracking-[-0.045em] whitespace-nowrap"
        style={{ '--join': `${join}px` } as CSSProperties}
      >
        <span ref={be} className="inline-block">
          <Word inAt={80}>Be</Word>
        </span>{' '}
        <span className="relative inline-block">
          <Word inAt={1300} className="intro-fold">
            a
          </Word>
          {/* "Loud" sits where "a Laude" will be, and drops out as they rise */}
          <span className="absolute top-0 left-0">
            <Word inAt={200} outAt={940}>
              Loud
            </Word>
          </span>
        </span>{' '}
        <span ref={laude} className="intro-join inline-block">
          <Word inAt={1380}>Laude</Word>
        </span>
      </p>

      {/* The wordmark the sentence becomes */}
      <p
        className="col-start-1 row-start-1 inline-flex items-center gap-[0.35em] text-[clamp(2.25rem,9vw,4.75rem)] leading-none"
        style={{ '--swirl': `${swirl}px` } as CSSProperties}
      >
        <span ref={flower} className="intro-flower relative z-10 inline-flex">
          <LogoMark className="size-[1.15em]" />
        </span>
        <span ref={name} className="intro-name font-pixel">
          BELaude<span className="text-up-maroon">.</span>
        </span>
      </p>
    </div>
  )
}

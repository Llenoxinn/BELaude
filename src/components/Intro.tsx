import { useEffect, useState } from 'react'
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

/**
 * First-load intro: "Be Loud", then "Be a Laude", then the sunflower turns in beside "BELaude." and
 * the screen lifts away. Once per session, skipped by any click or key, and never shown with reduced
 * motion. Decorative: the page is already rendered underneath and screen readers skip it.
 */
export function Intro() {
  const { reduced } = useMotion()
  const [show, setShow] = useState(() => !reduced && !seen())

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
    const t = window.setTimeout(done, 4000)
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
    <div id="intro" aria-hidden className="intro fixed inset-0 z-[100] flex items-center justify-center bg-background px-6">
      <div className="relative grid place-items-center text-[clamp(2.5rem,8vw,5.5rem)] leading-none font-semibold tracking-[-0.04em]">
        <span className="intro-word col-start-1 row-start-1 whitespace-nowrap" style={{ animationDelay: '80ms' }}>
          Be Loud
        </span>
        <span className="intro-word col-start-1 row-start-1 whitespace-nowrap" style={{ animationDelay: '900ms' }}>
          Be a Laude
        </span>
        <span className="col-start-1 row-start-1 inline-flex items-center gap-[0.3em]">
          <LogoMark className="intro-flower size-[1.1em]" />
          <span className="intro-name font-pixel font-normal tracking-normal">
            BELaude<span className="text-up-maroon">.</span>
          </span>
        </span>
      </div>
    </div>
  )
}

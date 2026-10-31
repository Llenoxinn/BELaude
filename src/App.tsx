import { lazy, Suspense, useEffect, useRef } from 'react'
import { SiteFooter } from '@/components/SiteFooter'
import { SiteHeader } from '@/components/SiteHeader'
import { MotionProvider } from '@/lib/motion'
import { useRoute } from '@/lib/router'
import { StoreProvider } from '@/lib/store'
import { Landing } from '@/pages/Landing'

// Split off the calculator so the landing page loads fast on mobile data.
const Calculator = lazy(() => import('@/pages/Calculator').then((m) => ({ default: m.Calculator })))

const TITLES = {
  '/': 'BELaude: your roadmap to Latin honors',
  '/calculator': 'Check my standing · BELaude',
}

export default function App() {
  const route = useRoute()

  // On a route change, update the title and move focus to the new view (client routing resets nothing).
  const firstRender = useRef(true)
  useEffect(() => {
    document.title = TITLES[route]
    if (firstRender.current) {
      firstRender.current = false
      return
    }
    if (route !== '/') window.scrollTo({ top: 0 })
    requestAnimationFrame(() => document.getElementById('main')?.focus({ preventScroll: route === '/' }))
  }, [route])

  return (
    <MotionProvider>
      <StoreProvider>
        <a
          href="#main"
          onClick={(e) => {
            e.preventDefault()
            document.getElementById('main')?.focus()
          }}
          className="sr-only rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50"
        >
          Skip to content
        </a>
        <SiteHeader route={route} />
        {route === '/' && <Landing />}
        <Suspense fallback={<div className="min-h-[60vh]" />}>{route === '/calculator' && <Calculator />}</Suspense>
        <SiteFooter />
      </StoreProvider>
    </MotionProvider>
  )
}

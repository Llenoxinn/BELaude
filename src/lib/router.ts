import { useEffect, useState } from 'react'

export type Route = '/' | '/calculator'

const ROUTES: Route[] = ['/', '/calculator']

/** Hash routes ("#/calculator") so the static build works on any host. Plain "#faq" anchors stay on the landing page. */
function parse(hash: string): Route {
  if (!hash.startsWith('#/')) return '/'
  const path = hash.slice(1) as Route
  return ROUTES.includes(path) ? path : '/'
}

export function useRoute(): Route {
  const [route, setRoute] = useState(() => parse(window.location.hash))
  useEffect(() => {
    const onChange = () => setRoute(parse(window.location.hash))
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])
  return route
}

export function href(route: Route): string {
  return `#${route}`
}

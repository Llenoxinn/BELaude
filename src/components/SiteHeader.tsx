import { GithubLogo } from '@phosphor-icons/react'
import { LogoMark } from '@/components/LogoMark'
import { Button } from '@/components/ui/button'
import { useInView } from '@/lib/motion'
import { href, type Route } from '@/lib/router'
import { REPO_URL } from '@/lib/site'
import { cn } from '@/lib/utils'

/** Sticky header: icon and name | section links (landing only), source link and the main action. */
export function SiteHeader({ route }: { route: Route }) {
  // A sentinel at the top of the page; the header gets its hairline once it scrolls away.
  const [sentinel, atTop] = useInView<HTMLDivElement>(false, '0px')
  return (
    <>
      <div ref={sentinel} aria-hidden className="absolute top-0 h-px w-full" />
      <header
        className={cn(
          'sticky top-0 z-40 border-b transition-[background-color,border-color] duration-300',
          atTop ? 'border-transparent bg-background' : 'border-border bg-background/85 backdrop-blur-md',
        )}
      >
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:gap-5 sm:px-6">
          <a href={href('/')} aria-label="BELaude home" className="group mr-auto inline-flex min-h-11 items-center gap-2.5 rounded-sm">
            {/* Eight petals: a 45° turn on hover lands back on the same shape */}
            <LogoMark className="size-8 transition-transform duration-500 ease-[var(--ease-out)] group-hover:rotate-45 [html[data-motion=reduce]_&]:transition-none" />
            <span className="font-pixel text-[1.375rem] leading-none">BELaude</span>
          </a>
          <nav aria-label="Main" className="flex items-center gap-2 sm:gap-5">
            {route === '/' && (
              <>
                <a href="#how" className="hidden min-h-11 items-center text-sm md:inline-flex">
                  <span className="link-draw">How it works</span>
                </a>
                <a href="#faq" className="hidden min-h-11 items-center text-sm md:inline-flex">
                  <span className="link-draw">FAQ</span>
                </a>
              </>
            )}
            <a
              href={REPO_URL}
              target="_blank"
              rel="noreferrer"
              className="inline-flex size-11 items-center justify-center rounded-md text-muted-foreground transition-colors duration-150 hover:text-foreground"
            >
              <GithubLogo aria-hidden className="size-5" />
              <span className="sr-only">BELaude source on GitHub (opens in a new tab)</span>
            </a>
            {route !== '/calculator' && (
              <Button variant="mono" size="sm" asChild>
                <a href={href('/calculator')}>Check my standing</a>
              </Button>
            )}
          </nav>
        </div>
      </header>
    </>
  )
}

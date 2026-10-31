import { ArrowDown } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Wordmark } from '@/components/Wordmark'
import { useInView } from '@/lib/motion'
import { href, type Route } from '@/lib/router'
import { cn } from '@/lib/utils'

/** Three-column header strip (design.md 2b): wordmark | one sentence | outlined mono-caps button. */
export function SiteHeader({ route }: { route: Route }) {
  // A sentinel at the top of the page; the header gets its hairline once it scrolls away.
  const [sentinel, atTop] = useInView<HTMLDivElement>(false, '0px')
  return (
    <>
      <div ref={sentinel} aria-hidden className="absolute top-0 h-px w-full" />
      <header
        className={cn(
          'sticky top-0 z-40 border-b bg-background transition-colors duration-300',
          atTop ? 'border-transparent' : 'border-border',
        )}
      >
        <div className="mx-auto grid h-16 max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-6 px-4 sm:px-6">
          <a href={href('/')} aria-label="BELaude home" className="rounded-sm">
            <Wordmark size="sm" animate={false} />
          </a>
          <p className="hidden items-center justify-center gap-2 text-sm text-muted-foreground lg:flex">
            Your grades so far, and what you need next.
            <ArrowDown aria-hidden className="size-3.5" />
          </p>
          <nav aria-label="Main" className="col-start-3 flex items-center gap-5">
            <a href="#how" className="hidden min-h-11 items-center text-sm sm:inline-flex">
              <span className="link-draw">How it works</span>
            </a>
            <a href="#faq" className="hidden min-h-11 items-center text-sm sm:inline-flex">
              <span className="link-draw">FAQ</span>
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

import { ArrowSquareOut } from '@phosphor-icons/react'
import { Tower } from '@/components/ascii'
import { useMotion } from '@/lib/motion'
import { FEEDBACK_URL, rulesVerifiedLine } from '@/lib/site'
import { cn } from '@/lib/utils'

export function SiteFooter() {
  const { reduced, preference, setPreference } = useMotion()
  return (
    <footer className="mt-24 border-t border-border bg-surface-alt sm:mt-32">
      <div className="mx-auto grid max-w-6xl items-end gap-10 px-4 py-14 sm:px-6 md:grid-cols-[auto_1fr] md:gap-16 md:py-16">
        <Tower />
        <div className="max-w-[60ch]">
          <p className="font-serif text-2xl leading-tight">An unofficial tool made by a UP student.</p>
          <p className="mt-3 text-body-sm text-muted-foreground">
            BELaude uses plain arithmetic, keeps your grades on your device and does not decide honors. Final honors are
            determined by UP.
          </p>
          <p className="mt-3 text-caption text-muted-foreground">{rulesVerifiedLine()}</p>

          <div className="mt-6 flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-border pt-4">
            <a className="inline-flex min-h-11 items-center gap-1.5 text-body-sm" href={FEEDBACK_URL} target="_blank" rel="noreferrer">
              <span className="link-draw">Send feedback</span>
              <ArrowSquareOut aria-hidden className="size-3.5 text-muted-foreground" />
              <span className="sr-only">(opens in a new tab)</span>
            </a>
            <button
              type="button"
              role="switch"
              aria-checked={reduced}
              onClick={() => setPreference(preference === null ? !reduced : !preference)}
              className="group inline-flex min-h-11 items-center gap-3 text-body-sm"
            >
              <span
                aria-hidden
                className={cn(
                  'relative h-6 w-10 shrink-0 rounded-full border transition-colors duration-150',
                  reduced ? 'border-up-maroon bg-up-maroon' : 'border-input bg-background',
                )}
              >
                <span
                  className={cn(
                    'absolute top-1/2 left-0.5 size-[1.125rem] -translate-y-1/2 rounded-full transition-transform duration-150 ease-out',
                    reduced ? 'translate-x-4 bg-white' : 'bg-[var(--input)]',
                  )}
                />
              </span>
              Reduce motion
            </button>
          </div>
        </div>
      </div>
    </footer>
  )
}

import { ArrowSquareOut, GithubLogo } from '@phosphor-icons/react'
import { CampusScene } from '@/components/ascii'
import { ReportButton } from '@/components/ReportDialog'
import { Button } from '@/components/ui/button'
import { useMotion } from '@/lib/motion'
import { href } from '@/lib/router'
import { GITHUB_PROFILE_URL, REPO_URL } from '@/lib/site'
import { cn } from '@/lib/utils'

function OutLink({ href, children }: { href: string; children: string }) {
  return (
    <a className="inline-flex min-h-11 items-center gap-1.5 text-body-sm" href={href} target="_blank" rel="noreferrer">
      <span className="link-draw">{children}</span>
      <ArrowSquareOut aria-hidden className="size-3.5 text-muted-foreground" />
      <span className="sr-only">(opens in a new tab)</span>
    </a>
  )
}

export function SiteFooter() {
  const { reduced, preference, setPreference } = useMotion()
  return (
    <footer className="mt-24 border-t border-border bg-surface-alt sm:mt-32">
      <div className="mx-auto max-w-6xl px-4 pt-12 sm:px-6 sm:pt-16">
        <CampusScene className="text-up-maroon" />
      </div>

      <div className="mx-auto grid max-w-6xl gap-12 px-4 pt-12 pb-12 sm:px-6 md:grid-cols-[1.2fr_1fr] md:gap-16 md:pt-16">
        <div>
          <h2 className="font-serif text-3xl leading-tight">Wanna work with me?</h2>
          <p className="mt-2 max-w-[40ch] text-body-sm text-muted-foreground">
            Have a project, an idea or a role in mind? My other work is on GitHub, and so is a way to reach me.
          </p>
          <Button variant="mono" size="sm" className="mt-5" asChild>
            <a href={GITHUB_PROFILE_URL} target="_blank" rel="noreferrer">
              <GithubLogo aria-hidden className="size-4" />
              Llenoxinn on GitHub
              <span className="sr-only">(opens in a new tab)</span>
            </a>
          </Button>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-8">
          <div>
            <h2 className="meta-label font-sans">BELaude</h2>
            <ul className="mt-2">
              <li>
                <a className="inline-flex min-h-11 items-center text-body-sm" href={href('/calculator')}>
                  <span className="link-draw">Check my standing</span>
                </a>
              </li>
              <li>
                <a className="inline-flex min-h-11 items-center text-body-sm" href="#how">
                  <span className="link-draw">How it works</span>
                </a>
              </li>
              <li>
                <a className="inline-flex min-h-11 items-center text-body-sm" href="#faq">
                  <span className="link-draw">FAQ</span>
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="meta-label font-sans">Project</h2>
            <ul className="mt-2">
              <li>
                <OutLink href={REPO_URL}>Source code</OutLink>
              </li>
              <li>
                <ReportButton
                  className="inline-flex min-h-11 items-center text-body-sm"
                  spec={{
                    title: 'Send feedback',
                    subject: 'BELaude: feedback',
                    facts: [],
                    noteLabel: 'Your feedback',
                    notePlaceholder: 'A bug, an idea, a program to add…',
                    noteRequired: true,
                  }}
                >
                  <span className="link-draw">Send feedback</span>
                </ReportButton>
              </li>
            </ul>
          </div>
        </nav>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 sm:px-6 md:flex-row md:items-center md:justify-between md:gap-12">
          <div className="max-w-[72ch] text-caption text-muted-foreground">
            <p>
              <span className="text-foreground">Unofficial.</span> Made by a UP student, not by UP. Your grades stay on your
              device, and the University Registrar decides final honors.
            </p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={reduced}
            onClick={() => setPreference(preference === null ? !reduced : !preference)}
            className="group inline-flex min-h-11 shrink-0 items-center gap-3 self-start text-body-sm md:self-auto"
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
    </footer>
  )
}

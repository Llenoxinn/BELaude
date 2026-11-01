import { useEffect, useId, useState, type CSSProperties, type ReactNode } from 'react'
import { HeroSunflower } from '@/components/ascii'
import { SablayLine } from '@/components/SablayLine'
import { Term, GLOSSARY } from '@/components/Term'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { mixHint } from '@/lib/copy'
import { exampleGrades } from '@/lib/gwa'
import { Wordmark } from '@/components/Wordmark'
import { Ambient, Reveal, useInView } from '@/lib/motion'
import { href } from '@/lib/router'
import { rules } from '@/lib/rules'
import { cn } from '@/lib/utils'

const STEPS = [
  { title: 'Pick your program', text: 'Choose your degree program, or type in its total units yourself.' },
  { title: 'Add your grades', text: "Enter each semester’s GWA, or each course if you don’t know it. NSTP and PE are left out for you." },
  { title: 'Get your roadmap', text: 'See the GWA you need each semester, what is likely, and what is still possible.' },
]

const RANGES = [
  { tier: 'Summa cum laude', range: '1.0000 to 1.2000'},
  { tier: 'Magna cum laude', range: '1.2001 to 1.4500' },
  { tier: 'Cum laude', range: '1.4501 to 1.7500'},
]

// A made-up example for the hero preview and the bento, not a real student’s grades.
const EXAMPLE = [
  { sem: '1st sem, AY 2026–27', units: 21, target: 1.41 },
  { sem: '2nd sem, AY 2026–27', units: 20, target: 1.41 },
  { sem: '1st sem, AY 2027–28', units: 21, target: 1.41 },
]
const WHY: { title: string; body: ReactNode }[] = [
  {
    title: 'Built for UP',
    body: (
      <>
        UP’s cutoffs, grading scale and exclusions come preloaded. <Term tip={GLOSSARY.NSTP}>NSTP</Term>,{' '}
        <Term tip={GLOSSARY.PE}>PE</Term>, <Term tip={GLOSSARY.INC}>INC</Term> and thesis grades are handled for you.
      </>
    ),
  },
  {
    title: 'Honest numbers',
    body: 'Exact, never rounded in your favor. If a goal is out of reach, it says so and shows what is still possible.',
  },
  {
    title: 'Private by design',
    body: 'No account, no upload, no server. Your grades never leave this device.',
  },
]

export function Landing() {
  // Coming from another page with "#faq" or "#how": scroll once the section exists.
  useEffect(() => {
    const id = window.location.hash.slice(1)
    if (id && !id.startsWith('/')) document.getElementById(id)?.scrollIntoView()
  }, [])

  return (
    <main id="main" tabIndex={-1}>
      {/* Hero: the promise on the left, what it looks like on the right */}
      <section className="hero-glow relative mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-20 sm:px-6 sm:pt-24 md:grid-cols-[1.1fr_1fr] md:pb-32">
        <div>
          <Badge tone="maroon">For UP students, and unofficial</Badge>
          <h1 className="mt-6 max-w-[16ch] text-[2.5rem] leading-[1.05] tracking-[-0.04em] sm:text-[4rem]">Don’t just compute your GWA. Plan it.</h1>
          <p className="mt-6 max-w-[48ch] text-lead text-muted-foreground">
            Tell BELaude your grades so far. It shows the GWA you need each semester to graduate with Latin honors.
          </p>
          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5">
            <Button size="lg" asChild>
              <a href={href('/calculator')}>Check my standing</a>
            </Button>
            <p className="text-sm text-muted-foreground">No sign-up. Your grades stay on your device.</p>
          </div>
        </div>
        <Reveal index={1}>
          <RoadmapPreview />
        </Reveal>
      </section>

      {/* Why BELaude: one gapless bento */}
      <section aria-labelledby="why" className="mx-auto max-w-6xl px-4 pb-24 sm:px-6 md:pb-32">
        <Reveal>
          <h2 id="why" className="max-w-[24ch] text-[2.25rem] leading-[1.1]">
            <span className="block">Other calculators look back.</span> <span className="block">This one looks forward.</span>
          </h2>
        </Reveal>
        <Reveal className="mt-12">
          <TargetDemo />
        </Reveal>
        <div className="mt-16 grid gap-10 md:grid-cols-3 md:gap-12">
          {WHY.map((item, i) => (
            <Reveal key={item.title} index={i} className="border-t border-border pt-6">
              <h3 className="text-lg">{item.title}</h3>
              <p className="mt-2 max-w-[40ch] text-body-sm text-muted-foreground">{item.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <HowItWorks />

      <Section
        id="thresholds"
        title="Latin honors in UP"
        intro={
          <>
            Your <Term tip={GLOSSARY.GWA}>GWA</Term> at graduation decides the tier. It is compared at 4 decimal places, so
            1.4501 is cum laude, not magna.
          </>
        }
      >
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="meta-label pb-3 font-normal">
                Honor
              </th>
              <th scope="col" className="meta-label pb-3 text-right font-normal">
                GWA range
              </th>
            </tr>
          </thead>
          <tbody>
            {RANGES.map((r, i) => (
              <Reveal as="tr" index={i} key={r.tier} className="border-b border-border">
                <td className="py-4 text-xl font-semibold tracking-[-0.02em]">
                  {r.tier}
                </td>
                <td className="py-4 text-right tabular">{r.range}</td>
              </Reveal>
            ))}
          </tbody>
        </table>
      </Section>

      <Faq />

      {/* The developer's note: honors are a number, not the measure of an education */}
      <section aria-labelledby="note-title" className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid items-center gap-12 border-t border-border py-20 md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] md:gap-16 md:py-28">
          <Reveal>
            <h2 id="note-title" className="text-[2.25rem] leading-[1.1]">
              A note from the developer
            </h2>
            <div className="mt-6 max-w-[58ch] space-y-4 text-lead text-muted-foreground">
              <p>
                BELaude is a small side project. It does the arithmetic behind Latin honors, but it doesn’t claim that a GWA
                measures your education, or that honors are the point of being in UP.
              </p>
              <p>
                Learn because you want to understand, not just for the number. Don’t trade your health, your sleep or the people
                you care about for a cutoff. No laude is worth that.
              </p>
            </div>
            <p className="mt-10 max-w-[30ch] text-[1.75rem] leading-[1.25] font-semibold tracking-[-0.03em] text-balance sm:text-[2rem]">
              And if you do graduate with one, it doesn’t put you above anyone. It’s one more reason to serve the people.
            </p>
          </Reveal>
          <div className="flex justify-center md:justify-end">
            <Ambient className="note-art">
              <HeroSunflower />
            </Ambient>
          </div>
        </div>
      </section>

      <section aria-labelledby="cta" className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="grid gap-10 border-t border-border py-20 md:grid-cols-[1fr_auto] md:items-end md:gap-16 md:py-28">
          <div>
            <Wordmark size="sm" animate={false} />
            <h2 id="cta" className="mt-10 max-w-[18ch] text-[2.5rem] leading-[1.05] tracking-[-0.04em] sm:text-[3.5rem]">
              See what your next semester needs.
            </h2>
          </div>
          <div className="md:pb-1">
            <Button size="lg" asChild>
              <a href={href('/calculator')}>Check my standing</a>
            </Button>
            <p className="mt-3 text-caption text-muted-foreground">About a minute. Nothing leaves your device.</p>
          </div>
        </Reveal>
      </section>
    </main>
  )
}

function HowItWorks() {
  return (
    <section id="how" aria-labelledby="how-title" className="border-b border-border bg-surface-alt">
      <SablayLine />
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        <Reveal>
          <h2 id="how-title" className="text-[2.25rem]">
            Your roadmap in about a minute
          </h2>
        </Reveal>
        <ol className="mt-12 grid gap-10 md:grid-cols-3 md:gap-8">
          {STEPS.map((step, i) => (
            <Step key={step.title} index={i} {...step} />
          ))}
        </ol>
      </div>
    </section>
  )
}

/** Each step number darkens as it scrolls into view, with a line drawing toward the next. */
function Step({ index, title, text }: { index: number; title: string; text: string }) {
  const [ref, inView] = useInView<HTMLLIElement>()
  return (
    <li ref={ref} className={cn('reveal relative', inView && 'is-visible')} style={{ '--i': index } as CSSProperties}>
      <div className="flex items-center gap-4">
        <kbd
          className={cn(
            'inline-flex size-9 items-center justify-center rounded-md border border-border bg-background font-sans text-body-sm font-semibold tabular transition-colors duration-500',
            inView ? 'text-foreground' : 'text-faint',
          )}
          style={{ transitionDelay: `${index * 200}ms` }}
        >
          {index + 1}
        </kbd>
        {index < STEPS.length - 1 && (
          <span aria-hidden className="hidden h-px flex-1 overflow-hidden md:block">
            <span
              className={cn('block h-full origin-left bg-border-strong transition-transform duration-700', inView ? 'scale-x-100' : 'scale-x-0')}
              style={{ transitionDelay: `${index * 200 + 200}ms` }}
            />
          </span>
        )}
      </div>
      <h3 className="mt-4 text-2xl">{title}</h3>
      <p className="mt-2 max-w-[38ch] text-muted-foreground">{text}</p>
    </li>
  )
}

function Faq() {
  const items = [
    {
      q: 'What counts in my GWA?',
      a: (
        <p>
          Every course with a numeric grade from 1.00 to 5.00, weighted by its units: add up grade times units, then divide by
          the total units. In UP, a lower GWA is better.
        </p>
      ),
    },
    {
      q: "What’s left out?",
      a: (
        <p>
          NSTP, PE and HK, Residency, courses numbered {rules.excluded.courseNumbers.join(', ')}, dropped courses (DRP), and
          qualitative grades (P, F, S, U). For thesis or SP courses ({rules.thesisCourseNumbers.join(', ')}), an S counts for
          its full units at your final thesis grade. These follow published UP rules and should be confirmed with the
          Registrar.
        </p>
      ),
    },
    {
      q: 'How is “the GWA I need” worked out?',
      a: (
        <p>
          (cutoff × total units − grade points so far) ÷ units left. Targets are rounded toward the better grade, so 1.4167
          shows as 1.41: getting the number shown always keeps you on track. Your targets update every time you add a
          semester.
        </p>
      ),
    },
    {
      q: 'Can I still graduate with honors if I got a 4.00 or 5.00?',
      a: (
        <p>
          In UP generally, yes. A 4.00 or 5.00 counts in your GWA like any other grade, and there is no grade floor (a grade
          below 2.50 doesn’t rule you out either): what matters is your final GWA. UP Visayas is the exception, with its own
          rule against 4.00 or 5.00 in prescribed courses. An INC isn’t counted until you add the grade you expect.
        </p>
      ),
    },
    {
      q: "I’m delayed. Can I still be a laude?",
      a: (
        <p>
          Yes. Taking longer than the normal length of your program doesn’t disqualify you, as long as you were not underloaded
          in any semester (fewer than the regular load of {rules.regularLoadUnits} units). Add the extra semesters in the
          calculator and your targets adjust.
        </p>
      ),
    },
    {
      q: 'What are University Scholar, College Scholar and Honor Roll?',
      a: (
        <p>
          Semester awards: a semester GWA of 1.45 or better, 1.75 or better, and 2.00 or better, with a regular load (normally{' '}
          {rules.regularLoadUnits} units) and no failing grade. BELaude shows them as an unofficial guide;
          your college confirms them.
        </p>
      ),
    },
    {
      q: 'Is my data saved?',
      a: (
        <p>
          Only on this device, in your browser. There is no account and no server, and nothing is sent anywhere. Clearing your
          browser data erases it, so use Export to keep a backup file.
        </p>
      ),
    },
    {
      q: 'Is this official?',
      a: (
        <p>
          No. BELaude is an unofficial tool made by a UP student. Final honors are determined by UP, and an underloaded
          semester can change the outcome even with the right GWA.
        </p>
      ),
    },
  ]
  return (
    <Section id="faq" title="Questions students ask" divider>
      <div className="faq border-t border-border">
        {items.map((item) => (
          <details key={item.q} className="group border-b border-border">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-4 text-lead font-medium transition-colors duration-150 hover:text-up-maroon [&::-webkit-details-marker]:hidden">
              {item.q}
              <span aria-hidden className="relative size-3.5 shrink-0">
                <span className="absolute top-1/2 left-0 h-px w-full -translate-y-1/2 bg-current" />
                <span className="absolute top-0 left-1/2 h-full w-px -translate-x-1/2 bg-current transition-transform duration-200 group-open:rotate-90" />
              </span>
            </summary>
            <div className="max-w-[65ch] pb-5 text-body-sm text-muted-foreground">{item.a}</div>
          </details>
        ))}
      </div>
    </Section>
  )
}

/**
 * The reference sections share one grid: heading on the left, content on the right, on the same
 * container as the hero, so every section starts at the same edge.
 */
function Section({
  id,
  title,
  intro,
  divider,
  children,
}: {
  id: string
  title: string
  intro?: ReactNode
  divider?: boolean
  children: ReactNode
}) {
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="mx-auto max-w-6xl px-4 sm:px-6">
      <div className={cn('grid gap-8 py-16 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] md:gap-16 md:py-24', divider && 'border-t border-border')}>
        <Reveal className="md:sticky md:top-24 md:self-start">
          <h2 id={`${id}-title`} className="text-[2.25rem]">
            {title}
          </h2>
          {intro && <p className="mt-3 max-w-[40ch] text-muted-foreground">{intro}</p>}
        </Reveal>
        <div>{children}</div>
      </div>
    </section>
  )
}

/** The hero's example: the results card in a plain window frame. Made-up numbers, labelled as such. */
function RoadmapPreview() {
  return (
    <figure>
      <div className="overflow-hidden rounded-xl border border-border bg-background">
        <div aria-hidden className="flex items-center gap-1.5 border-b border-border px-4 py-3">
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="size-2.5 rounded-full bg-border" />
          <span className="ml-3 text-caption text-muted-foreground">Your roadmap</span>
        </div>
        <div className="p-6 sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="meta-label">Your goal</p>
            <Badge tone="green">Within reach</Badge>
          </div>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.03em]">Magna cum laude</p>
          <p className="text-body-sm text-muted-foreground">Final GWA of 1.4500 or better</p>
          <p className="mt-6 meta-label">What you need each semester</p>
          <p className="mt-1 flex items-baseline gap-2">
            <span className="font-display text-[3.5rem] leading-none text-up-maroon tabular">1.41</span>
            <span className="text-lg font-medium">or better</span>
          </p>
          <ul className="mt-6 border-t border-border">
            {EXAMPLE.map((row) => (
              <li key={row.sem} className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 border-b border-border py-2.5 text-body-sm">
                <span>
                  {row.sem} <span className="text-muted-foreground">· {row.units} units</span>
                </span>
                <span className="tabular text-up-maroon">{row.target.toFixed(2)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5">
            <div aria-hidden className="h-1.5 overflow-hidden rounded-full bg-neutral-tint">
              <div className="h-full w-[51%] rounded-full bg-up-green" />
            </div>
            <p className="mt-1.5 text-caption text-muted-foreground">79 of 155 units done</p>
          </div>
        </div>
      </div>
      <figcaption className="mt-3 text-caption text-muted-foreground">Example roadmap, not a real student’s grades.</figcaption>
    </figure>
  )
}

/**
 * Try a target: the slider sets a semester GWA and the six courses below show one way to meet it.
 * The same grade mix the results page uses, so the example never disagrees with the calculator.
 */
function TargetDemo() {
  const id = useId()
  const [target, setTarget] = useState(1.41)
  const grades = exampleGrades(target) ?? []
  const best = Math.min(...grades)
  const avg = grades.reduce((a, b) => a + b, 0) / (grades.length || 1)
  return (
    <div className="grid gap-12 rounded-xl bg-surface-alt p-6 sm:p-12 md:grid-cols-[1fr_1.15fr] md:gap-16">
      <div>
        <h3 className="text-2xl">The GWA you need, in real grades</h3>
        <p className="mt-3 max-w-[44ch] text-muted-foreground">
          A target like 1.41 is hard to picture. BELaude turns it into the grades that get you there, for every semester you
          have left. Try one.
        </p>
        <label htmlFor={id} className="mt-10 block meta-label">
          Semester GWA to aim for
        </label>
        <output htmlFor={id} className="mt-1 block font-display text-[3.5rem] leading-none text-up-maroon tabular">
          {target.toFixed(2)}
        </output>
        <input
          id={id}
          type="range"
          min={1}
          max={3}
          step={0.01}
          value={target}
          onChange={(e) => setTarget(Number(e.target.value))}
          className="target-range mt-5 w-full"
        />
        <div aria-hidden className="mt-1 flex justify-between text-caption text-muted-foreground">
          <span>1.00, best</span>
          <span>3.00</span>
        </div>
      </div>
      <div className="md:pt-1">
        <p className="meta-label">One semester of 6 courses that meets it</p>
        <ul className="mt-4 grid grid-cols-3 gap-2">
          {grades.map((g, i) => (
            <li
              key={i}
              className={cn(
                'grade-chip flex h-16 items-center justify-center rounded-lg border text-2xl font-medium tabular',
                g === best && grades.some((x) => x !== best) ? 'border-transparent bg-green-tint text-green-ink' : 'border-border bg-background',
              )}
            >
              {g.toFixed(2)}
            </li>
          ))}
        </ul>
        <p aria-live="polite" className="mt-5 text-body-sm">
          <span className="tabular">{avg.toFixed(4)}</span> average. <span className="text-muted-foreground">{mixHint(target)}</span>
        </p>
      </div>
    </div>
  )
}

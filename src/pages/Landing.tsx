import { useEffect, type CSSProperties, type ReactNode } from 'react'
import { HeroSunflower } from '@/components/ascii'
import { Term, GLOSSARY } from '@/components/Term'
import { Button } from '@/components/ui/button'
import { mixHint } from '@/lib/copy'
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
  { tier: 'Summa cum laude', range: '1.0000 to 1.2000' },
  { tier: 'Magna cum laude', range: '1.2001 to 1.4500' },
  { tier: 'Cum laude', range: '1.4501 to 1.7500' },
]

// A made-up example for the feature block, not a real student’s grades.
const EXAMPLE = [
  { sem: '1st sem, AY 2026–27', target: 1.41 },
  { sem: '2nd sem, AY 2026–27', target: 1.41 },
  { sem: '1st sem, AY 2027–28', target: 1.41 },
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
    title: 'Honest, and kind about it',
    body: 'Exact numbers, never padded. If a goal is out of reach, it tells you gently and shows what is still possible.',
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
      {/* Hero */}
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-4 pt-14 pb-16 sm:px-6 sm:pt-24 md:grid-cols-[1.25fr_1fr] md:pb-28">
        <div>
          <Wordmark />
          <h1 className="mt-10 max-w-[18ch] text-[2.25rem] sm:text-[3.5rem]">
            Don’t just compute your GWA. Plan it.
          </h1>
          <p className="mt-5 max-w-[52ch] text-lead text-muted-foreground">
            Tell BELaude your grades so far. It shows the GWA you need each semester to graduate with Latin honors, and tells
            you kindly if you can’t.
          </p>
          <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:gap-5">
            <Button size="lg" asChild>
              <a href={href('/calculator')}>Check my standing</a>
            </Button>
            <p className="text-sm text-muted-foreground">No sign-up. Your grades stay on your device.</p>
          </div>
        </div>
        <div className="flex justify-center">
          <Ambient>
            <HeroSunflower />
          </Ambient>
        </div>
      </section>

      <HowItWorks />

      {/* Why BELaude: one asymmetric bento */}
      <section aria-labelledby="why" className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-32">
        <Reveal>
          <h2 id="why" className="max-w-[24ch] text-[2.25rem]">
            <span className="block">Other calculators look back.</span> <span className="block">This one looks forward.</span>
          </h2>
        </Reveal>
        <div className="mt-12 grid gap-10 md:grid-cols-[1.4fr_1fr] md:gap-12">
          <Reveal index={0} className="rounded-xl border border-border p-6 sm:p-8">
            <h3 className="text-2xl">A roadmap, not a verdict</h3>
            <p className="mt-2 max-w-[46ch] text-muted-foreground">
              See the semester GWA you need for every term you have left, and what it takes in actual grades. Add a semester
              and the numbers update.
            </p>
            <div aria-label="Example roadmap, not real data" role="group" className="mt-8 border-t border-border">
              <p className="meta-label pt-4">Example: what Magna takes from here</p>
              <ul className="mt-2">
                {EXAMPLE.map((row) => (
                  <li key={row.sem} className="grid grid-cols-[1fr_auto] items-baseline gap-x-4 border-b border-border py-3 text-sm">
                    <span className="text-muted-foreground">{row.sem}</span>
                    <span className="tabular">
                      <span className="text-up-maroon">{row.target.toFixed(2)}</span>
                      <span className="text-muted-foreground"> or better</span>
                    </span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-caption text-muted-foreground">{mixHint(EXAMPLE[0].target)}</p>
            </div>
          </Reveal>
          <ul className="grid border-t border-border md:grid-rows-3">
            {WHY.map((item, i) => (
              <Reveal as="li" key={item.title} index={i + 1} className="flex flex-col justify-center border-b border-border py-6">
                <h3 className="text-xl">{item.title}</h3>
                <p className="mt-1.5 max-w-[42ch] text-body-sm text-muted-foreground">{item.body}</p>
              </Reveal>
            ))}
          </ul>
        </div>
      </section>

      {/* Honors thresholds */}
      <section aria-labelledby="thresholds" className="mx-auto max-w-4xl px-4 py-20 sm:px-6 md:py-32">
        <Reveal>
          <h2 id="thresholds" className="text-[2.25rem]">
            Latin honors in UP
          </h2>
          <p className="mt-3 max-w-[60ch] text-muted-foreground">
            Your <Term tip={GLOSSARY.GWA}>GWA</Term> at graduation decides the tier. It is compared at 4 decimal places, so
            1.4501 is cum laude, not magna.
          </p>
        </Reveal>
        <table className="mt-10 w-full text-left">
          <thead>
            <tr className="border-b border-border">
              <th scope="col" className="meta-label py-3 font-normal">
                Honor
              </th>
              <th scope="col" className="meta-label py-3 text-right font-normal">
                GWA range
              </th>
            </tr>
          </thead>
          <tbody>
            {RANGES.map((r, i) => (
              <Reveal as="tr" index={i} key={r.tier} className="border-b border-border">
                <td className="py-4 font-serif text-xl">{r.tier}</td>
                <td className="py-4 text-right tabular">{r.range}</td>
              </Reveal>
            ))}
          </tbody>
        </table>
      </section>

      <Faq />

      <section aria-labelledby="cta" className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        <Reveal className="grid gap-8 border-t border-foreground pt-12 md:grid-cols-[1fr_auto] md:items-end md:gap-16 md:pt-16">
          <h2 id="cta" className="max-w-[18ch] text-[2.5rem] sm:text-[3.5rem]">
            See what your next semester needs.
          </h2>
          <div>
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
    <section id="how" aria-labelledby="how-title" className="border-y border-border bg-surface-alt">
      <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6 md:py-32">
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

/** Each step number lights up in maroon as it scrolls into view, with a line drawing toward the next. */
function Step({ index, title, text }: { index: number; title: string; text: string }) {
  const [ref, inView] = useInView<HTMLLIElement>()
  return (
    <li ref={ref} className={cn('reveal relative', inView && 'is-visible')} style={{ '--i': index } as CSSProperties}>
      <div className="flex items-center gap-4">
        <span
          className={cn(
            'font-serif text-[1.75rem] leading-none tabular transition-colors duration-500',
            inView ? 'text-up-maroon' : 'text-faint',
          )}
          style={{ transitionDelay: `${index * 200}ms` }}
        >
          {String(index + 1).padStart(2, '0')}
        </span>
        {index < STEPS.length - 1 && (
          <span aria-hidden className="hidden h-px flex-1 overflow-hidden md:block">
            <span
              className={cn('block h-full origin-left bg-up-maroon/40 transition-transform duration-700', inView ? 'scale-x-100' : 'scale-x-0')}
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
    <section id="faq" aria-labelledby="faq-title" className="mx-auto max-w-3xl px-4 py-20 sm:px-6 md:py-32">
      <Reveal>
        <h2 id="faq-title" className="text-[2.25rem]">
          Questions students ask
        </h2>
      </Reveal>
      <div className="faq mt-8 border-t border-border">
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
    </section>
  )
}

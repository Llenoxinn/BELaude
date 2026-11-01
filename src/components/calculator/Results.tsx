import { useEffect, useMemo, useState, type CSSProperties } from 'react'
import { CheckCircle, Flag, DownloadSimple, Info, PencilSimple, WarningCircle, X } from '@phosphor-icons/react'
import { SemesterChart } from './SemesterChart'
import { ExampleSemester, GwaScale, MiniScale, PointsBudget, type ScaleMarker } from './Visuals'
import { GrowthSunflower, Laurel, stageName, useRolling } from '@/components/ascii'
import { Badge } from '@/components/ui/badge'
import { Button, buttonVariants } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { fmt, mixHint, statusCopy, type Tone } from '@/lib/copy'
import { useMotion } from '@/lib/motion'
import { computeResults, type Results, type TierResult } from '@/lib/results'
import { rules } from '@/lib/rules'
import { canShare, renderShareCard } from '@/lib/shareCard'
import { rulesVerifiedLine } from '@/lib/site'
import { ReportButton } from '@/components/ReportDialog'
import { activeProgram, parseNumber } from '@/lib/state'
import { useStore } from '@/lib/store'
import { cn, downloadBlob } from '@/lib/utils'

const seq = (n: number) => ({ '--seq': n }) as CSSProperties

export function ResultsView({ onEdit }: { onEdit: (step: number) => void }) {
  const { state, update } = useStore()
  const res = useMemo(() => computeResults(state), [state])
  const { reduced } = useMotion()

  // The arrival sequence plays once; any click or key skips to the end.
  const [skip, setSkip] = useState(reduced)
  useEffect(() => {
    if (skip) return
    const done = () => setSkip(true)
    const t = setTimeout(done, 2400)
    window.addEventListener('pointerdown', done, { once: true })
    window.addEventListener('keydown', done, { once: true })
    return () => {
      clearTimeout(t)
      window.removeEventListener('pointerdown', done)
      window.removeEventListener('keydown', done)
    }
  }, [skip])

  if (res.errors.length) {
    return (
      <div className="rounded-lg border border-border p-6 sm:p-8">
        <h1 className="text-3xl">A few things to fix first</h1>
        <ul className="mt-4 space-y-2 text-muted-foreground">
          {res.errors.map((e) => (
            <li key={e} className="flex gap-2">
              <WarningCircle aria-hidden className="mt-1 size-4 shrink-0 text-up-maroon" /> {e}
            </li>
          ))}
        </ul>
        <div className="mt-6 flex gap-3">
          <Button variant="outline" onClick={() => onEdit(0)}>
            Edit program
          </Button>
          <Button onClick={() => onEdit(2)}>Edit grades</Button>
        </div>
      </div>
    )
  }

  const copy = statusCopy(res)
  const focus = res.focus
  const setFocus = (tier: TierResult) => update((s) => ({ ...s, focusTier: tier.tier.id }))
  const setPlanned = (id: string, value: string) =>
    update((s) => ({ ...s, semesters: s.semesters.map((x) => (x.id === id ? { ...x, plannedGwa: value } : x)) }))
  const showBudget =
    focus && res.R > 0 && focus.plan.required !== null && ['reachable', 'stretch', 'theoretical'].includes(focus.status) && !res.upcoming.some((u) => u.planned !== null)

  return (
    <div className={cn('results space-y-16', skip && 'seq-skip')}>
      {/* Status */}
      <section aria-labelledby="status" className="seq-item" style={seq(0)}>
        <Badge tone={copy.badge.tone} className="seq-pop" style={seq(1)}>
          {copy.badge.label}
        </Badge>
        <h1
          id="status"
          data-step-title
          tabIndex={-1}
          className={cn('mt-4', copy.headline.length > 60 ? 'text-[1.75rem] sm:text-[2.1rem]' : 'text-[2rem] sm:text-[2.6rem]')}
        >
          {copy.headline}
        </h1>
        <p className="mt-4 max-w-[60ch] text-lead text-muted-foreground">{copy.body}</p>
        <Notices res={res} />
      </section>

      {/* Goal picker: first, so the plan below follows the student's choice */}
      {res.state !== 'done' && (
        <section aria-labelledby="tiers" className="seq-item" style={seq(2)}>
          <SectionHead id="tiers" title="Pick your goal" />
          <p className="mt-2 max-w-[60ch] text-body-sm text-muted-foreground">
            Each Latin honor and what it takes from here. Choose one and the plan below follows it.
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            {res.tiers.map((t) => (
              <TierCard key={t.tier.id} tier={t} focused={focus === t} onSelect={() => setFocus(t)} />
            ))}
          </div>
        </section>
      )}

      {/* The goal, and what it takes each semester */}
      <section className="seq-item" style={seq(3)}>
        {res.state === 'none' ? <BestOutcome res={res} /> : res.state === 'done' ? <FinalOutcome res={res} onEdit={() => onEdit(2)} /> : <GoalCard res={res} skip={skip} />}
      </section>

      {/* Where you stand on the honors scale */}
      <section aria-labelledby="scale" className="seq-item" style={seq(4)}>
        <SectionHead id="scale" title="Where you stand on the honors scale" />
        <p className="mt-2 max-w-[60ch] text-body-sm text-muted-foreground">
          Latin honors depend on your final GWA: all your units, from first year to graduation.
        </p>
        <div className="mt-8">
          <GwaScale markers={scaleMarkers(res)} focus={focus?.tier.id} />
        </div>
      </section>

      {/* Why the number is what it is */}
      {showBudget && (
        <section aria-labelledby="budget" className="seq-item" style={seq(5)}>
          <SectionHead id="budget" title={`Where ${fmt.target(focus!.plan.required!)} comes from`} />
          <p className="mt-2 max-w-[60ch] text-body-sm text-muted-foreground">
            Each grade adds grade points (grade × units). Lower is better, so {focus!.tier.short} sets a ceiling on your total.
          </p>
          <div className="mt-6">
            <PointsBudget tierName={focus!.tier.name} cutoff={focus!.tier.maxGwa} T={res.T} P={res.P} U={res.U} R={res.R} seq={5} />
          </div>
        </section>
      )}

      {/* Semester by semester */}
      {(res.done.length > 0 || res.upcoming.length > 0) && (
        <section aria-labelledby="plan" className="seq-item" style={seq(6)}>
          <SectionHead id="plan" title={focus && res.upcoming.length ? `Semester by semester to ${focus.tier.short}` : 'Your semesters'} />
          <div className="mt-6">
            <SemesterChart res={res} seq={6} />
          </div>
          {focus && res.upcoming.length > 0 && <Roadmap res={res} focus={focus} onPlan={setPlanned} />}
          {res.unitsAdjusted && (
            <p className="mt-3 text-caption text-muted-foreground">
              Your remaining {fmt.units(res.R)} units were spread across these semesters in proportion to their expected loads.
            </p>
          )}
          {res.done.length > 0 && <SemesterList res={res} />}
        </section>
      )}

      {/* Scenarios */}
      {res.scenarios.length > 0 && (
        <section aria-labelledby="scenarios" className="seq-item" style={seq(7)}>
          <SectionHead id="scenarios" title="Where you’d finish" />
          <p className="mt-2 max-w-[60ch] text-body-sm text-muted-foreground">
            Your final GWA at graduation under a few simple assumptions about your remaining {fmt.units(res.R)} units. Each bar is
            the honors scale from above (better on the left); the dot is where you’d finish. Arithmetic, not a forecast.
          </p>
          <ScenarioList res={res} />
        </section>
      )}

      {/* Actions */}
      <section aria-label="Actions" className="seq-item flex flex-wrap gap-3 border-t border-border pt-8" style={seq(8)}>
        <ShareButton res={res} />
        <Button variant="outline" onClick={() => onEdit(2)}>
          <PencilSimple aria-hidden /> Edit grades
        </Button>
      </section>

      <p className="text-caption text-faint">
        {rulesVerifiedLine()} BELaude is unofficial: the University Registrar makes the official determination.
      </p>
    </div>
  )
}

function SectionHead({ id, title }: { id: string; title: string }) {
  return (
    <h2 id={id} className="text-3xl">
      {title}
    </h2>
  )
}

function scaleMarkers(res: Results): ScaleMarker[] {
  const markers: ScaleMarker[] = []
  if (res.cumulativeGwa !== null) markers.push({ value: res.cumulativeGwa, label: res.R > 0 ? 'Your GWA now' : 'Your final GWA', tone: 'black' })
  const likely = res.scenarios.find((s) => s.id === 'likely')
  if (likely?.final != null && res.done.length > 0) markers.push({ value: likely.final, label: 'If you keep your recent pace', tone: 'gray' })
  if (res.R > 0 && res.bestFinal !== null) markers.push({ value: res.bestFinal, label: 'Best you can still finish with', tone: 'green' })
  return markers
}

/** Things worth knowing that change the math or eligibility: underloads and pending INCs. */
function Notices({ res }: { res: Results }) {
  const items: string[] = []
  const load = rules.regularLoadUnits
  if (res.underload.done.length) {
    items.push(
      `${res.underload.done.map((d) => d.label).join(', ')} had fewer than ${load} units counted in your GWA. If ${res.underload.done.length > 1 ? 'any of those was' : 'that was'} an underload, it can cost you Latin honors, even with the right GWA.`,
    )
  }
  if (res.underload.upcoming.length) {
    items.push(`Some semesters ahead have fewer than ${load} units. Keep at least a regular load each semester: an underload can cost you Latin honors.`)
  }
  if (res.pendingInc) {
    items.push(`${res.pendingInc} INC grade${res.pendingInc > 1 ? 's are' : ' is'} not counted yet. Add the grade you expect to include it.`)
  }
  if (res.unresolvedThesisUnits) {
    items.push(`${fmt.units(res.unresolvedThesisUnits)} units of S in thesis or SP will count once you enter the final thesis grade.`)
  }
  if (!items.length) return null
  return (
    <ul className="mt-6 space-y-2">
      {items.map((t) => (
        <li key={t} className="flex max-w-[64ch] gap-2.5 rounded-lg bg-gold-tint px-4 py-3 text-body-sm">
          <Info aria-hidden className="mt-0.5 size-5 shrink-0 text-gold-ink" />
          {t}
        </li>
      ))}
    </ul>
  )
}

/** The headline answer: the final-GWA goal, and the semester GWA it takes, kept visibly separate. */
function GoalCard({ res, skip }: { res: Results; skip: boolean }) {
  const focus = res.focus!
  const required = focus.plan.required
  const planned = res.upcoming.some((u) => u.planned !== null)
  const freeCount = res.upcoming.filter((u) => u.planned === null).length
  const shown = useRolling(required ?? 0, 700, skip ? 0 : 600, skip)
  const locked = focus.status === 'locked' || (required !== null && required > 5)
  const impossible = required !== null && required < 1 - 1e-9

  return (
    <div className="grid gap-8 rounded-xl border border-border p-6 sm:p-8 md:grid-cols-[1fr_auto]">
      <div>
        <p className="meta-label">Your goal</p>
        <p className="mt-2 font-serif text-[1.75rem] leading-tight sm:text-[2.1rem]">
          Graduate <span className="text-up-maroon">{focus.tier.name}</span>
        </p>
        <p className="mt-2 text-body-sm text-muted-foreground">
          That means a <strong className="font-medium text-foreground">final GWA of {focus.tier.maxGwa.toFixed(4)} or better</strong>{' '}
          when you graduate, counting all {fmt.units(res.T)} units.
        </p>

        <div className="mt-7 border-t border-border pt-6">
          <p className="meta-label">What you need each semester</p>
          {required === null ? (
            <p className="mt-2 font-serif text-[1.75rem] leading-tight">
              Your what-if plan finishes at <span className="tabular text-up-maroon">{fmt.gwa(focus.plan.finalIfPlanned!)}</span>
              {focus.plan.finalIfPlanned! <= focus.tier.maxGwa + 1e-9 ? `, inside ${focus.tier.short}.` : `, outside ${focus.tier.short}.`}
            </p>
          ) : locked ? (
            <p className="mt-2 font-serif text-[1.75rem] leading-tight">Any passing grades keep {focus.tier.short}. Just avoid an underload.</p>
          ) : impossible ? (
            <p className="mt-2 font-serif text-[1.75rem] leading-tight">
              With your what-if plan, {focus.tier.short} is out of reach. Change the semesters you planned below.
            </p>
          ) : (
            <>
              <div className="mt-1 flex flex-wrap items-baseline gap-x-3">
                <span className="font-serif text-[4.5rem] leading-none tracking-[-0.03em] text-up-maroon tabular sm:text-[5.5rem]">
                  {fmt.target(shown)}
                </span>
                <span className="font-serif text-2xl">or better</span>
              </div>
              <p className="mt-3 text-body-sm">
                as your <strong className="font-medium">semester GWA</strong> in{' '}
                {planned ? `each of the ${freeCount} semesters you haven’t planned` : freeCount === 1 ? 'your last semester' : `each of your ${freeCount} remaining semesters`}{' '}
                ({fmt.units(res.upcoming.filter((u) => u.planned === null).reduce((a, u) => a + u.units, 0))} units).
              </p>
              <p className="mt-1 text-caption text-muted-foreground">{mixHint(required)}</p>
              <ExampleSemester target={required} />
            </>
          )}
        </div>
      </div>
      <Progress res={res} skip={skip} />
    </div>
  )
}

function Progress({ res, skip }: { res: Results; skip: boolean }) {
  const progress = res.T ? res.U / res.T : 0
  const still = res.state === 'none'
  const label = still
    ? `Sunflower, still growing: ${fmt.units(res.U)} of ${fmt.units(res.T)} units completed`
    : `Sunflower ${stageName(progress)}: ${fmt.units(res.U)} of ${fmt.units(res.T)} units completed`
  return (
    <div className="flex flex-col items-center gap-3 self-center justify-self-center">
      <GrowthSunflower progress={progress} label={label} stillGrowing={still} delay={skip ? 0 : 800} skip={skip} />
      <div className="w-40">
        <div aria-hidden className="h-1.5 overflow-hidden rounded-full bg-neutral-tint">
          <div className="h-full origin-left bg-up-green" style={{ transform: `scaleX(${Math.min(1, progress)})` }} />
        </div>
        <p className="mt-1.5 text-center meta-label">{still ? 'Still growing · ' : ''}{fmt.units(res.U)} of {fmt.units(res.T)} units done</p>
      </div>
    </div>
  )
}

/** No honors reachable: the best and realistic finish, said plainly (plan.md 4b). */
function BestOutcome({ res }: { res: Results }) {
  const likely = res.scenarios.find((s) => s.id === 'likely')
  const optimistic = res.scenarios.find((s) => s.id === 'optimistic')
  return (
    <div className="grid gap-8 rounded-xl border border-border p-6 sm:p-8 md:grid-cols-[1fr_auto]">
      <div className="space-y-6">
        <dl className="grid gap-6 sm:grid-cols-2">
          <div>
            <dt className="meta-label">Best final GWA you can still get</dt>
            <dd className="mt-1 font-serif text-5xl text-up-maroon tabular">{res.bestFinal !== null ? fmt.gwa(res.bestFinal) : 'n/a'}</dd>
            <dd className="mt-1 text-caption text-muted-foreground">If every remaining grade is 1.00.</dd>
          </div>
          {likely?.final != null && (
            <div>
              <dt className="meta-label">Realistic final GWA</dt>
              <dd className="mt-1 font-serif text-5xl tabular">{fmt.gwa(likely.final)}</dd>
              <dd className="mt-1 text-caption text-muted-foreground">{likely.assumption}.</dd>
            </div>
          )}
        </dl>
        {optimistic?.final != null && optimistic.average !== null && (
          <p className="max-w-[56ch] text-body-sm">
            A strong finish: if you match your best semester so far ({fmt.gwa(optimistic.average)}) from here, you’d graduate with
            a GWA of {fmt.gwa(optimistic.final)}.
          </p>
        )}
        <p className="max-w-[56ch] text-body-sm text-muted-foreground">
          Latin honors is one measure, not the whole story. If this is weighing on you, talk to someone: your adviser, your friends,
          or your college’s guidance and counseling office.
        </p>
      </div>
      <Progress res={res} skip />
    </div>
  )
}

function FinalOutcome({ res, onEdit }: { res: Results; onEdit: () => void }) {
  return (
    <div className="rounded-xl border border-border p-6 sm:p-8">
      <p className="meta-label">Your final GWA</p>
      <p className="mt-2 font-serif text-[4.5rem] leading-none text-up-maroon tabular">
        {res.cumulativeGwa !== null ? fmt.gwa(res.cumulativeGwa) : 'n/a'}
      </p>
      {res.main && <p className="mt-3 font-serif text-2xl">{res.main.tier.name} range</p>}
      {res.cumulativeGwa !== null && <RecordCheck ours={res.cumulativeGwa} semesters={res.done.length} onEdit={onEdit} />}
    </div>
  )
}

/** True when the official GWA, at the decimals it was typed with, equals ours rounded or truncated. */
function sameGwa(ours: number, official: string): boolean {
  const d = Math.min(4, (official.split('.')[1] ?? '').length)
  const f = 10 ** d
  const target = Math.round(Number(official) * f)
  return Math.round(ours * f) === target || Math.floor(ours * f + 1e-9) === target
}

/** A graduate can check BELaude's math against their transcript; a mismatch lists what to re-check first. */
function RecordCheck({ ours, semesters, onEdit }: { ours: number; semesters: number; onEdit: () => void }) {
  const { state, update } = useStore()
  const official = parseNumber(state.officialGwa)
  const valid = official !== null && official >= 1 && official <= 5
  const match = valid && sameGwa(ours, state.officialGwa.trim())
  const shown = fmt.gwa(ours)
  const report = { ours: shown, official: state.officialGwa.trim(), program: activeProgram(state)?.name ?? 'Own numbers', semesters }

  return (
    <div className="mt-8 border-t border-border pt-6">
      <label htmlFor="official-gwa" className="text-body-sm font-medium">
        Check it against your transcript
      </label>
      <p id="official-gwa-hint" className="mt-1 max-w-[56ch] text-caption text-muted-foreground">
        Type the GWA on your transcript of records. BELaude tells you if its math agrees.
      </p>
      <Input
        id="official-gwa"
        inputMode="decimal"
        autoComplete="off"
        placeholder="1.6000"
        className="mt-3 max-w-40 tabular"
        value={state.officialGwa}
        aria-describedby="official-gwa-hint"
        onChange={(e) => update((s) => ({ ...s, officialGwa: e.target.value }))}
      />

      {/* Rendered empty first so the verdict is announced when it appears; the checklist sits outside it */}
      <div role="status" className="mt-4">
        {valid && match && (
          <p className="flex items-start gap-2 text-body-sm text-up-green">
            <CheckCircle aria-hidden weight="fill" className="mt-0.5 size-4 shrink-0" />
            It matches. BELaude’s {shown} agrees with your transcript.
          </p>
        )}
        {valid && !match && (
          <p className="flex items-start gap-2 text-body-sm font-medium text-up-maroon">
            <WarningCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
            These don’t match: BELaude has {shown}, your transcript has {state.officialGwa.trim()}.
          </p>
        )}
      </div>
      {valid && !match && (
        <div className="mt-3 rounded-lg border border-up-maroon/40 bg-maroon-tint/50 p-4">
          <p className="text-body-sm">Before trusting either number, check what you entered:</p>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-body-sm text-muted-foreground">
            <li>Every semester and midyear you took is listed, including extra or repeated ones.</li>
            <li>Each semester’s units count only GWA courses: NSTP and PE are left out.</li>
            <li>Grades that changed later are updated, such as a completed INC or 4.00.</li>
            <li>Dropped courses and courses graded P, S or U are left out.</li>
          </ul>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Button variant="outline" size="sm" onClick={onEdit}>
              <PencilSimple aria-hidden /> Review my grades
            </Button>
            <ReportButton
              className={buttonVariants({ variant: 'outline', size: 'sm' })}
              spec={{
                title: 'Report a calculation problem',
                subject: `BELaude: GWA mismatch (${report.program})`,
                facts: [
                  ['BELaude’s GWA', report.ours],
                  ['Your transcript', report.official],
                  ['Program', report.program],
                  ['Semesters entered', String(report.semesters)],
                ],
                noteLabel: 'Anything else?',
                notePlaceholder: 'For example: I shifted programs in my 2nd year.',
              }}
            >
              <Flag aria-hidden /> Report a calculation error
            </ReportButton>
          </div>
          <p className="mt-2 text-caption text-muted-foreground">
            All of these check out and they still differ? Report it so BELaude can be fixed. Only both GWAs and your program are
            sent, never your grades.
          </p>
        </div>
      )}
    </div>
  )
}

const STATUS: Record<TierResult['status'], { word: string; tone: Tone }> = {
  locked: { word: 'Secured', tone: 'green' },
  reachable: { word: 'Reachable', tone: 'green' },
  stretch: { word: 'Stretch', tone: 'gold' },
  theoretical: { word: 'Only with all 1.00s', tone: 'neutral' },
  out: { word: 'Out of reach', tone: 'neutral' },
  achieved: { word: 'Achieved', tone: 'green' },
  missed: { word: 'Not reached', tone: 'neutral' },
}

const BLOCK: Record<Tone, string> = {
  maroon: 'bg-maroon-tint text-up-maroon',
  green: 'bg-green-tint text-up-green',
  gold: 'bg-gold-tint text-gold-ink',
  neutral: 'bg-neutral-tint text-muted-foreground',
}

/** Goal card (design.md 2b): tier name in mono caps on a tint block, both GWAs spelled out underneath. */
function TierCard({ tier, focused, onSelect }: { tier: TierResult; focused: boolean; onSelect: () => void }) {
  const status = STATUS[tier.status]
  const selectable = tier.status !== 'out'
  const need =
    tier.status === 'locked'
      ? 'Kept even with all 5.00s'
      : tier.status === 'out'
        ? 'Would need better than 1.00'
        : tier.status === 'theoretical'
          ? 'Every remaining grade 1.00'
          : `${fmt.target(tier.required)} or better`
  return (
    <button
      type="button"
      disabled={!selectable}
      aria-pressed={focused}
      onClick={onSelect}
      className={cn(
        'rounded-lg border bg-background p-4 text-left transition-colors duration-150 disabled:cursor-default',
        focused ? 'border-up-maroon' : 'border-border enabled:hover:border-border-strong',
      )}
    >
      <span className="flex items-center justify-between gap-2">
        <Laurel active={focused}>
          <span className={cn('inline-block rounded-[4px] px-2 py-0.5 text-body-sm font-semibold', BLOCK[focused ? 'maroon' : status.tone])}>
            {tier.tier.short}
          </span>
        </Laurel>
      </span>
      {/* Buttons only take phrasing content, so the pairs are spans, not a <dl> */}
      <span className="mt-3 block space-y-2 text-caption">
        <span className="block">
          <span className="block text-muted-foreground">Final GWA needed</span>
          <span className="block tabular">{tier.tier.maxGwa.toFixed(4)} or better</span>
        </span>
        <span className="block">
          <span className="block text-muted-foreground">Semester GWA from here</span>
          <span className={cn('block tabular', selectable && 'text-up-maroon')}>{need}</span>
        </span>
      </span>
      <span className="mt-3 flex items-center justify-between gap-2">
        <span className="meta-label">{status.word}</span>
        {focused && (
          <span className="inline-flex items-center gap-1 whitespace-nowrap text-caption font-medium text-up-maroon">
            <CheckCircle aria-hidden weight="fill" className="size-4" />
            Your goal
          </span>
        )}
      </span>
    </button>
  )
}

function Roadmap({ res, focus, onPlan }: { res: Results; focus: TierResult; onPlan: (id: string, value: string) => void }) {
  return (
    <div className="mt-8">
      <p className="max-w-[60ch] text-body-sm text-muted-foreground">
        Expecting a heavy or light semester? Type the GWA you expect under “What if I get” and the other semesters recalculate.
      </p>
      <div className="mt-4 hidden grid-cols-[1fr_10rem_8.5rem] gap-4 border-b border-border pb-2 sm:grid" aria-hidden>
        <span className="meta-label">Semester</span>
        <span className="meta-label">Semester GWA needed</span>
        <span className="meta-label">What if I get</span>
      </div>
      <ol>
        {res.upcoming.map((u, i) => {
          const t = focus.plan.semesters[i]
          const raw = u.semester.plannedGwa
          const invalid = raw.trim() !== '' && u.planned === null
          return (
            <li key={u.semester.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 border-b border-border py-4 sm:grid-cols-[1fr_10rem_8.5rem]">
              <div className="col-span-2 sm:col-span-1">
                <p className={cn('text-body-sm', i === 0 && 'font-medium')}>
                  {u.label}
                  {i === 0 && (
                    <Badge tone="maroon" className="ml-2 align-middle">
                      Next
                    </Badge>
                  )}
                </p>
                <p className="text-caption text-muted-foreground">
                  {u.semester.yearLabel ? `${u.semester.yearLabel}, ` : ''}
                  {fmt.units(u.units)} units
                </p>
              </div>
              <div>
                <TargetCell target={t.target} planned={t.planned} />
              </div>
              <div className="justify-self-end sm:justify-self-stretch">
                <div className="flex items-center gap-1">
                  <Input
                    aria-label={`What if I get this semester GWA in ${u.label}`}
                    inputMode="decimal"
                    placeholder="e.g. 1.25"
                    className="h-10 w-24 tabular"
                    value={raw}
                    aria-invalid={invalid}
                    aria-describedby={invalid ? `whatif-${u.semester.id}` : undefined}
                    autoComplete="off"
                    name={`whatif-${u.semester.id}`}
                    onChange={(e) => onPlan(u.semester.id, e.target.value)}
                  />
                  {raw && (
                    <Button variant="ghost" size="icon" aria-label={`Clear what-if for ${u.label}`} onClick={() => onPlan(u.semester.id, '')}>
                      <X aria-hidden className="size-4" />
                    </Button>
                  )}
                </div>
                {invalid && (
                  <p id={`whatif-${u.semester.id}`} className="mt-1 text-caption text-up-maroon">
                    Enter 1.00 to 5.00
                  </p>
                )}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

function TargetCell({ target, planned }: { target: number; planned: boolean }) {
  if (planned) {
    return (
      <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
        <span className="font-serif text-[1.75rem] leading-none tabular">{fmt.grade(target)}</span>
        <span className="text-caption text-muted-foreground">your plan</span>
      </span>
    )
  }
  if (!Number.isFinite(target)) return <span className="text-sm text-muted-foreground">n/a</span>
  if (target < 1 - 1e-9) return <span className="text-sm text-muted-foreground">Not possible with this plan</span>
  if (target > 5) return <span className="text-body-sm font-medium text-up-maroon">Any grade</span>
  return (
    <span className="inline-flex items-baseline gap-1.5 whitespace-nowrap">
      <span className="font-serif text-[1.75rem] leading-none text-up-maroon tabular">{fmt.target(target)}</span>
      <span className="text-caption text-muted-foreground">or better</span>
    </span>
  )
}

function SemesterList({ res }: { res: Results }) {
  return (
    <details className="group mt-8">
      <summary className="flex min-h-11 cursor-pointer list-none items-center gap-2 meta-label hover:text-foreground">
        <span aria-hidden className="transition-transform duration-200 group-open:rotate-90">›</span>
        Semesters so far and semester awards
      </summary>
      <ul className="mt-2 border-t border-border">
        {res.done.map((d) => (
          <li key={d.semester.id} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-border py-2.5 text-sm">
            <span>{d.label}</span>
            <span className="flex items-center gap-3">
              {d.standing && (
                <Badge tone="green" title="Unofficial guide. Your college confirms semester awards.">
                  {d.standing}
                </Badge>
              )}
              <span className="tabular">{d.totals.gwa !== null ? fmt.gwa(d.totals.gwa) : 'pending'}</span>
              <span className="w-14 text-right tabular text-muted-foreground">{fmt.units(d.totals.units)} u</span>
            </span>
          </li>
        ))}
        {res.cumulativeGwa !== null && (
          <li className="flex items-center justify-between py-2.5 text-sm font-medium">
            <span>GWA so far (all semesters)</span>
            <span className="tabular">
              {fmt.gwa(res.cumulativeGwa)} <span className="ml-3 inline-block w-14 text-right font-normal text-muted-foreground">{fmt.units(res.U)} u</span>
            </span>
          </li>
        )}
      </ul>
    </details>
  )
}

function ScenarioList({ res }: { res: Results }) {
  return (
    <ul className="mt-6 border-t border-border">
      {res.scenarios.map((s) => (
        <li key={s.id} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 border-b border-border py-4 sm:grid-cols-[11rem_1fr_6rem_7rem]">
          <div className="sm:col-span-1">
            <p className="text-body-sm font-medium">{s.label}</p>
            <p className="text-caption text-muted-foreground">{s.assumption}</p>
          </div>
          <div className="col-span-2 row-start-2 sm:col-span-1 sm:row-start-auto">{s.final !== null && <MiniScale value={s.final} />}</div>
          <p className="col-start-2 row-start-1 text-right tabular sm:col-start-auto sm:row-start-auto">
            {s.final !== null ? fmt.gwa(s.final) : '—'}
          </p>
          <p className="col-span-2 text-right sm:col-span-1">
            {s.final === null ? (
              <span className="text-caption text-muted-foreground">Needs your grades</span>
            ) : s.tier ? (
              <Badge tone="green">{s.tier.short}</Badge>
            ) : (
              <Badge tone="neutral">No Latin honors</Badge>
            )}
          </p>
        </li>
      ))}
    </ul>
  )
}

function ShareButton({ res }: { res: Results }) {
  const [preview, setPreview] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  useEffect(() => () => void (preview && URL.revokeObjectURL(preview)), [preview])
  if (!canShare(res)) return null

  const save = async () => {
    const blob = await renderShareCard(res)
    if (!blob) return
    downloadBlob(blob, `belaude-roadmap-${res.focus!.tier.id}.png`)
    setPreview(URL.createObjectURL(blob))
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  return (
    <>
      <Button variant="accent" onClick={save}>
        <span aria-hidden className="relative size-4">
          <DownloadSimple className={cn('icon-swap absolute inset-0 size-4', saved && 'icon-swap-out')} />
          <CheckCircle className={cn('icon-swap absolute inset-0 size-4', !saved && 'icon-swap-out')} />
        </span>
        Save my roadmap card
      </Button>
      <span role="status" className="sr-only">
        {saved ? 'Roadmap card saved.' : ''}
      </span>
      {preview && (
        <img
          src={preview}
          alt={`Your Laude Roadmap card for ${res.focus!.tier.short}`}
          className="row-in mt-2 w-full basis-full rounded-lg border border-border"
        />
      )}
    </>
  )
}

import { useRef, useState } from 'react'
import { Plus, Trash } from '@phosphor-icons/react'
import { Field, StepNav, useFocusFirstInvalid } from './Field'
import { GLOSSARY, Term } from '@/components/Term'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { fmt } from '@/lib/copy'
import { semestralStanding, semesterTotals } from '@/lib/gwa'
import { ALL_GRADES, NUMERIC_GRADES, classifyCourse, isFailingGrade, rules } from '@/lib/rules'
import { blankSemester, newId, nextTerm, parseNumber, semesterLabel, sortSemesters, type Course, type Semester } from '@/lib/state'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { gradesIssues, type SemesterIssues } from '@/lib/validate'

export function GradesStep({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const { state, update } = useStore()
  const [tried, setTried] = useState(0)
  const scope = useRef<HTMLDivElement>(null)
  useFocusFirstInvalid(tried, scope)
  const issues = tried ? gradesIssues(state) : {}
  const issueCount = Object.keys(issues).length
  const semesters = sortSemesters(state.semesters)

  const patch = (id: string, p: Partial<Semester>) =>
    update((s) => ({ ...s, semesters: s.semesters.map((x) => (x.id === id ? { ...x, ...p } : x)) }))

  const remove = (sem: Semester) => {
    const hasData = sem.gwa || sem.courses.some((c) => c.grade)
    if (hasData && !window.confirm(`Remove ${semesterLabel(sem)} and the grades in it?`)) return
    update((s) => ({ ...s, semesters: s.semesters.filter((x) => x.id !== sem.id) }))
  }

  const add = (midyear: boolean) =>
    update((s) => {
      const { ay, term } = nextTerm(s.semesters, midyear)
      return { ...s, semesters: sortSemesters([...s.semesters, blankSemester(ay, term, new Date(), { status: 'upcoming', extra: true })]) }
    })

  const next = () => {
    setTried((n) => n + 1)
    const found = gradesIssues(state)
    if (Object.keys(found).length) {
      document.getElementById(`sem-${Object.keys(found)[0]}`)?.scrollIntoView({ block: 'center' })
      return
    }
    onNext()
  }

  return (
    <Card ref={scope}>
      <CardHeader>
        <CardTitle as="h1" data-step-title tabIndex={-1}>
          Your grades so far
        </CardTitle>
        <CardDescription>
          For each finished semester, enter its <Term tip={GLOSSARY.GWA}>GWA</Term>. Not sure of it? Enter each course
          instead and BELaude works it out.
        </CardDescription>
      </CardHeader>

      <div className="border-t border-border">
        {semesters.map((sem) => (
          <SemesterBlock
            key={sem.id}
            semester={sem}
            issues={issues[sem.id]}
            nudgeKey={tried}
            onChange={(p) => patch(sem.id, p)}
            onRemove={() => remove(sem)}
          />
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button variant="outline" size="sm" onClick={() => add(false)}>
          <Plus aria-hidden /> Add a semester
        </Button>
        <Button variant="outline" size="sm" onClick={() => add(true)}>
          <Plus aria-hidden /> Add a midyear term
        </Button>
      </div>
      <p className="mt-3 text-caption text-muted-foreground">
        Took a leave of absence, shifted, or need a 5th year? Add or remove semesters so the list matches your plan.
      </p>

      <StepNav
        onBack={onBack}
        onNext={next}
        nextLabel="See my roadmap"
        error={issueCount ? `Check the highlighted ${issueCount === 1 ? 'semester' : `${issueCount} semesters`} before continuing.` : null}
      />
    </Card>
  )
}

function SemesterBlock({
  semester: s,
  issues,
  nudgeKey,
  onChange,
  onRemove,
}: {
  semester: Semester
  issues?: SemesterIssues
  nudgeKey: number
  onChange: (p: Partial<Semester>) => void
  onRemove: () => void
}) {
  const label = semesterLabel(s)
  const isDone = s.status === 'done'
  const ids = { gwa: `gwa-${s.id}`, units: `units-${s.id}`, planned: `planned-${s.id}` }

  const setDone = (done: boolean) =>
    onChange({
      status: done ? 'done' : 'upcoming',
      units: s.units || s.plannedUnits,
      mode: done && s.courses.length && !s.gwa ? 'courses' : s.mode,
    })

  return (
    <section id={`sem-${s.id}`} aria-label={label} className="border-b border-border py-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl">{label}</h3>
          {s.yearLabel && <p className="text-caption text-muted-foreground">{s.yearLabel}</p>}
        </div>
        <div className="flex items-center gap-2">
          <div role="group" aria-label={`Is ${label} done?`} className="inline-flex rounded-[7px] border border-input p-0.5">
            {[
              { v: true, t: 'Done' },
              { v: false, t: 'Not yet' },
            ].map(({ v, t }) => (
              <button
                key={t}
                type="button"
                aria-pressed={isDone === v}
                onClick={() => setDone(v)}
                className={cn(
                  'min-h-9 rounded-[4px] px-3 text-caption transition-colors duration-150',
                  isDone === v ? 'bg-foreground text-background' : 'text-muted-foreground hover:text-foreground',
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <Button variant="ghost" size="icon" aria-label={`Remove ${label}`} onClick={onRemove}>
            <Trash aria-hidden className="size-4" />
          </Button>
        </div>
      </div>

      {isDone ? (
        <Tabs value={s.mode} onValueChange={(v) => onChange({ mode: v as Semester['mode'] })} className="mt-5">
          <TabsList>
            <TabsTrigger value="gwa">I know my GWA</TabsTrigger>
            <TabsTrigger value="courses">Enter each course</TabsTrigger>
          </TabsList>
          <TabsContent value="gwa">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field id={ids.gwa} label="Semester GWA" error={issues?.gwa} nudgeKey={nudgeKey}>
                <Input
                  id={ids.gwa}
                  inputMode="decimal"
                  placeholder="e.g. 1.50"
                  className="tabular"
                  value={s.gwa}
                  aria-invalid={!!issues?.gwa}
                  onChange={(e) => onChange({ gwa: e.target.value })}
                />
              </Field>
              <Field id={ids.units} label="Units counted in GWA" hint="Leave out NSTP and PE." error={issues?.units} nudgeKey={nudgeKey}>
                <Input
                  id={ids.units}
                  inputMode="decimal"
                  placeholder="e.g. 18"
                  className="tabular"
                  value={s.units}
                  aria-invalid={!!issues?.units}
                  onChange={(e) => onChange({ units: e.target.value })}
                />
              </Field>
            </div>
            <SemesterSummary semester={s} />
          </TabsContent>
          <TabsContent value="courses">
            <CourseTable semester={s} issues={issues} onChange={onChange} />
            <SemesterSummary semester={s} showWorking />
          </TabsContent>
        </Tabs>
      ) : (
        <div className="mt-4 max-w-56">
          <Field
            id={ids.planned}
            label="Expected units"
            hint="Units that will count in your GWA. Keep at least a regular load: an underload can cost Latin honors."
            error={issues?.units}
            nudgeKey={nudgeKey}
          >
            <Input
              id={ids.planned}
              inputMode="decimal"
              placeholder="e.g. 18"
              className="tabular"
              value={s.plannedUnits}
              onChange={(e) => onChange({ plannedUnits: e.target.value })}
            />
          </Field>
        </div>
      )}
    </section>
  )
}

function courseInput(c: Course) {
  return { code: c.code, units: parseNumber(c.units), grade: c.grade, expectedGrade: c.expectedGrade, countsInGWA: c.countsInGWA }
}

function CourseTable({ semester: s, issues, onChange }: { semester: Semester; issues?: SemesterIssues; onChange: (p: Partial<Semester>) => void }) {
  const setCourse = (id: string, p: Partial<Course>) => onChange({ courses: s.courses.map((c) => (c.id === id ? { ...c, ...p } : c)) })
  const addCourse = () =>
    onChange({ courses: [...s.courses, { id: newId('c'), code: '', title: '', units: '3', grade: '', expectedGrade: '' }] })
  const removeCourse = (id: string) => onChange({ courses: s.courses.filter((c) => c.id !== id) })

  return (
    <div>
      <div className="hidden grid-cols-[1fr_5.5rem_7rem_2.75rem] gap-2 pb-2 sm:grid" aria-hidden>
        <span className="meta-label">Course</span>
        <span className="meta-label">Units</span>
        <span className="meta-label">Grade</span>
      </div>
      <ul className="space-y-3 sm:space-y-2">
        {s.courses.map((c) => {
          const t = classifyCourse(courseInput(c))
          const excluded = t.kind === 'excluded' && !['Dropped'].includes(t.label) && !t.label.startsWith('Grade')
          const error = issues?.courses?.[c.id]
          const name = c.code || 'this course'
          return (
            <li key={c.id} className="row-in">
              <div className={cn('grid grid-cols-[5.5rem_1fr_2.75rem] gap-2 sm:grid-cols-[1fr_5.5rem_7rem_2.75rem]', excluded && 'opacity-60')}>
                <Input
                  aria-label="Course code"
                  placeholder="e.g. CMSC 11"
                  className="col-span-3 sm:col-span-1"
                  value={c.code}
                  onChange={(e) => setCourse(c.id, { code: e.target.value })}
                />
                <div className="relative">
                  <Input
                    aria-label={`Units for ${name}`}
                    aria-describedby={error ? `err-${c.id}` : undefined}
                    inputMode="decimal"
                    autoComplete="off"
                    className="pr-11 tabular"
                    value={c.units}
                    aria-invalid={!!error}
                    onChange={(e) => setCourse(c.id, { units: e.target.value })}
                  />
                  <span aria-hidden className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-caption text-muted-foreground">
                    units
                  </span>
                </div>
                <NativeSelect aria-label={`Grade for ${name}`} value={c.grade} className="tabular" onChange={(e) => setCourse(c.id, { grade: e.target.value })}>
                  <option value="">Grade</option>
                  {ALL_GRADES.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </NativeSelect>
                <Button variant="ghost" size="icon" aria-label={`Remove ${name}`} onClick={() => removeCourse(c.id)}>
                  <Trash aria-hidden className="size-4" />
                </Button>
              </div>
              <CourseNote course={c} treatment={t} error={error} onExpected={(g) => setCourse(c.id, { expectedGrade: g })} />
            </li>
          )
        })}
      </ul>
      <Button variant="outline" size="sm" className="mt-4" onClick={addCourse}>
        <Plus aria-hidden /> Add a course
      </Button>
      {issues?.general && (
        <p role="alert" className="mt-3 text-caption text-up-maroon">
          {issues.general}
        </p>
      )}
    </div>
  )
}

function CourseNote({
  course: c,
  treatment: t,
  error,
  onExpected,
}: {
  course: Course
  treatment: ReturnType<typeof classifyCourse>
  error?: string
  onExpected: (grade: string) => void
}) {
  if (error)
    return (
      <p id={`err-${c.id}`} className="mt-1 text-caption text-up-maroon">
        {error}
      </p>
    )
  if (c.grade.toUpperCase() === 'INC') {
    return (
      <div className="mt-2 flex flex-wrap items-center gap-2 text-caption text-muted-foreground">
        <label htmlFor={`exp-${c.id}`}>Expected grade:</label>
        <NativeSelect id={`exp-${c.id}`} value={c.expectedGrade} className="w-28 tabular" onChange={(e) => onExpected(e.target.value)}>
          <option value="">Not sure</option>
          {NUMERIC_GRADES.map((g) => (
            <option key={g} value={g}>
              {g}
            </option>
          ))}
        </NativeSelect>
        <span>{c.expectedGrade ? 'Counted using this grade for now.' : 'Not counted until you add one.'}</span>
      </div>
    )
  }
  if (t.kind === 'excluded') return <p className="mt-1 text-caption text-muted-foreground">{t.label}: not counted in GWA.</p>
  if (t.kind === 'pending' && t.reason === 'thesis-s') {
    return <p className="mt-1 text-caption text-muted-foreground">S in thesis or SP: counts at your final thesis grade once you enter it.</p>
  }
  return null
}

/** The semester’s computed GWA, with the working when entered per course, and its scholar standing. */
function SemesterSummary({ semester: s, showWorking = false }: { semester: Semester; showWorking?: boolean }) {
  const totals =
    s.mode === 'gwa'
      ? semesterTotals({ mode: 'gwa', gwa: parseNumber(s.gwa), units: parseNumber(s.units) })
      : semesterTotals({ mode: 'courses', courses: s.courses.map(courseInput) })
  const failing = s.mode === 'courses' && s.courses.some((c) => isFailingGrade(c.grade))
  const standing = semestralStanding(totals.gwa, totals.units, s.term === 3 ? 'midyear' : 'regular', failing)

  if (totals.gwa === null) return null
  const underload = s.term !== 3 && totals.units < rules.regularLoadUnits
  return (
    <>
      <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg bg-surface-alt px-4 py-3 text-sm">
      <span className="meta-label">Semester GWA</span>
      <span className="tabular text-base">{fmt.gwa(totals.gwa)}</span>
      {showWorking && (
        <span className="tabular text-caption text-muted-foreground">
          {totals.points.toFixed(2)} grade points ÷ {fmt.units(totals.units)} units
        </span>
      )}
      {standing && (
        <Badge tone="green" title="Unofficial guide. Your college confirms semester awards.">
          {standing}
        </Badge>
      )}
      </div>
      {underload && (
        <p className="mt-2 text-caption text-muted-foreground">
          {fmt.units(totals.units)} units is below a regular load of {rules.regularLoadUnits} (not counting PE and NSTP). If this
          semester was an underload, it can cost you Latin honors.
        </p>
      )}
    </>
  )
}

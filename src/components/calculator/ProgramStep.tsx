import { useRef, useState } from 'react'
import { ArrowSquareOut, CheckCircle, Info, PencilSimple } from '@phosphor-icons/react'
import { Field, StepNav, useFocusFirstInvalid } from './Field'
import { GLOSSARY, Term } from '@/components/Term'
import { Button } from '@/components/ui/button'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { NativeSelect } from '@/components/ui/native-select'
import { campuses, notCounted, programGwaUnits } from '@/lib/programs'
import { PROSPECTUS_ERROR_URL, formatDate, yearRanges } from '@/lib/site'
import type { Program } from '@/lib/programs'
import { activeProgram, OTHER_CAMPUS } from '@/lib/state'
import { useStore } from '@/lib/store'
import { programErrors } from '@/lib/validate'

export function ProgramStep({ onNext }: { onNext: () => void }) {
  const { state, update } = useStore()
  const [tried, setTried] = useState(0)
  const scope = useRef<HTMLDivElement>(null)
  useFocusFirstInvalid(tried, scope)
  const campus = campuses.find((c) => c.campusId === state.campusId)
  const program = activeProgram(state)
  const showCustom = !program && (state.campusId === OTHER_CAMPUS || !campus?.programs.length || state.programId === '')
  const errors = tried ? programErrors(state) : {}

  const setCustom = (patch: Partial<typeof state.custom>) => update((s) => ({ ...s, custom: { ...s.custom, ...patch } }))

  const useOwnNumbers = () => {
    if (!program) return
    update((s) => ({
      ...s,
      campusId: OTHER_CAMPUS,
      programId: '',
      custom: {
        totalUnits: String(programGwaUnits(program)),
        semesters: String(program.semesters.filter((p) => p.kind === 'regular').length),
      },
    }))
  }

  const next = () => {
    setTried((n) => n + 1)
    if (!Object.keys(programErrors(state)).length) onNext()
  }

  return (
    <Card ref={scope}>
      <CardHeader>
        <CardTitle as="h1" data-step-title tabIndex={-1}>
          Which program are you in?
        </CardTitle>
        <CardDescription>This sets how many units your GWA is counted over.</CardDescription>
      </CardHeader>

      <div className="space-y-6">
        <Field id="campus" label="Campus">
          <NativeSelect
            id="campus"
            value={state.campusId}
            onChange={(e) => update((s) => ({ ...s, campusId: e.target.value, programId: '' }))}
          >
            {campuses.map((c) => (
              <option key={c.campusId} value={c.campusId}>
                {c.campus}
              </option>
            ))}
            <option value={OTHER_CAMPUS}>Other campus, or I’d rather use my own numbers</option>
          </NativeSelect>
        </Field>

        {campus && campus.programs.length > 0 && (
          <Field id="program" label="Degree program">
            <NativeSelect id="program" value={state.programId} onChange={(e) => update((s) => ({ ...s, programId: e.target.value }))}>
              <option value="">Choose your program, or enter your own numbers below</option>
              {campus.programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </NativeSelect>
          </Field>
        )}

        {campus && campus.programs.length === 0 && (
          <p className="rounded-lg bg-surface-alt p-4 text-sm text-muted-foreground">
            {campus.campus} programs are still being added and checked against the official prospectus. For now, enter your
            program’s numbers below. They’re on your prospectus or checklist.
          </p>
        )}

        {program && <ProgramSummary program={program} onEdit={useOwnNumbers} />}

        {showCustom && (
          <div className="grid gap-6 sm:grid-cols-2">
            <Field
              id="total-units"
              label={
                <>
                  Total <Term tip={GLOSSARY.units}>units</Term> counted in your GWA
                </>
              }
              hint="Don’t include NSTP or PE units in your total."
              error={errors.totalUnits}
              nudgeKey={tried}
            >
              <Input
                id="total-units"
                inputMode="decimal"
                placeholder="e.g. 150"
                className="tabular"
                value={state.custom.totalUnits}
                aria-invalid={!!errors.totalUnits}
                onChange={(e) => setCustom({ totalUnits: e.target.value })}
              />
            </Field>
            <Field
              id="semesters"
              label="Regular semesters in your program"
              hint="Usually 8 for a four-year program. Midyear terms can be added later."
              error={errors.semesters}
              nudgeKey={tried}
            >
              <Input
                id="semesters"
                inputMode="numeric"
                placeholder="8"
                className="tabular"
                value={state.custom.semesters}
                aria-invalid={!!errors.semesters}
                onChange={(e) => setCustom({ semesters: e.target.value })}
              />
            </Field>
          </div>
        )}
      </div>

      <StepNav onNext={next} />
    </Card>
  )
}


/**
 * Confirms the chosen program: its name, the two numbers the math uses, anything that changes
 * them, where they came from, and a way out for students on a different curriculum.
 */
function ProgramSummary({ program, onEdit }: { program: Program; onEdit: () => void }) {
  const gwaUnits = programGwaUnits(program)
  const left = program.semesters.flatMap(notCounted)
  const regular = program.semesters.filter((s) => s.kind === 'regular').length
  const midyear = program.semesters.length - regular
  const notes = [
    left.length > 0 &&
      `${left.map((c) => c.code).join(' and ')} (${left.reduce((a, c) => a + c.units, 0)} units) ${left.length > 1 ? 'are' : 'is'} left out of the GWA under the 199-course rule, which is not yet confirmed with the Registrar.`,
    program.note,
  ].filter((n): n is string => Boolean(n))

  return (
    <section aria-labelledby="program-summary" className="rounded-lg border border-border">
      <div className="p-5 sm:p-6">
        <h2 id="program-summary" className="text-2xl">
          {program.name}
        </h2>
        {program.college && <p className="mt-1 text-body-sm text-muted-foreground">{program.college}</p>}

        <dl className="mt-6 grid grid-cols-2 gap-6">
          <div>
            <dt className="meta-label">Units in your GWA</dt>
            <dd className="mt-2 font-serif text-[2.5rem] leading-none tabular">{gwaUnits}</dd>
            {gwaUnits !== program.totalUnits && (
              <dd className="mt-1.5 text-caption text-muted-foreground">of {program.totalUnits} in the study plan</dd>
            )}
          </div>
          <div>
            <dt className="meta-label">Semesters</dt>
            <dd className="mt-2 font-serif text-[2.5rem] leading-none tabular">{regular}</dd>
            {midyear > 0 && (
              <dd className="mt-1.5 text-caption text-muted-foreground">
                plus {midyear} midyear term{midyear > 1 ? 's' : ''}
              </dd>
            )}
          </div>
        </dl>
      </div>

      <ul className="space-y-2.5 border-t border-border px-5 py-4 text-caption sm:px-6">
        <li className="flex gap-2.5">
          <CheckCircle aria-hidden className="mt-0.5 size-4 shrink-0 text-up-green" />
          NSTP and PE are already left out.
        </li>
        {notes.map((note) => (
          <li key={note} className="flex gap-2.5 text-muted-foreground">
            <Info aria-hidden className="mt-0.5 size-4 shrink-0" />
            {note}
          </li>
        ))}
        <li className="pl-[1.625rem] text-muted-foreground">
          From the{' '}
          <a
            href={program.source}
            target="_blank"
            rel="noreferrer"
            className="text-foreground underline decoration-border underline-offset-[3px] hover:decoration-current"
          >
            UP Cebu study plan
            <ArrowSquareOut aria-hidden className="ml-0.5 inline size-3.5 align-[-2px]" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
          {program.curriculum && ` (${yearRanges(program.curriculum)})`}, retrieved {formatDate(program.retrievedOn)}.
        </li>
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-border px-5 py-3 sm:px-6">
        <p className="text-caption text-muted-foreground">Different curriculum for your batch?</p>
        <div className="flex flex-wrap items-center gap-x-4">
          <a
            href={PROSPECTUS_ERROR_URL + encodeURIComponent(program.name)}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center text-caption text-muted-foreground hover:text-foreground"
          >
            <span className="link-draw">Report an error</span>
            <span className="sr-only"> in this study plan (opens in a new tab)</span>
          </a>
          <Button variant="outline" size="sm" onClick={onEdit}>
            <PencilSimple aria-hidden /> Use my own numbers
          </Button>
        </div>
      </div>
    </section>
  )
}

import { useMemo, useRef, useState } from 'react'
import { WarningCircle } from '@phosphor-icons/react'
import { Field, StepNav, useFocusFirstInvalid } from './Field'
import { Badge } from '@/components/ui/badge'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { applyGraduated, ayLabel, buildSemesters, currentTerm, parseNumber, termKey, termName, type Semester } from '@/lib/state'
import { useStore } from '@/lib/store'
import { batchError } from '@/lib/validate'

/** Groups semesters by year of study ("1st year"), falling back to the AY when there is no year label. */
function groupByYear(list: Semester[]) {
  const groups: { key: string; year: string; ay: string; items: Semester[] }[] = []
  for (const s of list) {
    const year = s.yearLabel.split(',')[0] || ayLabel(s.ay)
    const last = groups[groups.length - 1]
    if (last?.key === year) last.items.push(s)
    else groups.push({ key: year, year, ay: ayLabel(s.ay), items: [s] })
  }
  for (const g of groups) {
    const ays = [...new Set(g.items.map((s) => s.ay))]
    g.ay = ays.length > 1 ? `${ayLabel(ays[0])} to ${ayLabel(ays[ays.length - 1]).slice(3)}` : ayLabel(ays[0])
    if (g.year === g.ay) g.ay = ''
  }
  return groups
}

export function BatchStep({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const { state, update } = useStore()
  const [tried, setTried] = useState(0)
  const scope = useRef<HTMLDivElement>(null)
  useFocusFirstInvalid(tried, scope)
  const error = tried ? batchError(state) : null
  const valid = !batchError(state)
  const now = useMemo(() => new Date(), [])
  const cur = currentTerm(now)
  const preview = useMemo(() => (valid ? buildSemesters(state, now) : []), [state, valid, now])
  // Every semester in the study plan is already past: ask, rather than assume, whether they graduated.
  const allPast = preview.length > 0 && preview.every((s) => s.status === 'done')
  const gradError = tried && allPast && state.graduated === null ? 'Choose one to continue.' : null

  const next = () => {
    setTried((n) => n + 1)
    if (batchError(state) || (allPast && state.graduated === null)) return
    update((s) => {
      const built = buildSemesters(s)
      return { ...s, semesters: allPast ? applyGraduated(built, s.graduated === true, parseNumber(s.batchYear)) : built }
    })
    onNext()
  }

  return (
    <Card ref={scope}>
      <CardHeader>
        <CardTitle as="h1" data-step-title tabIndex={-1}>
          When did you enter UP?
        </CardTitle>
        <CardDescription>BELaude lists the semesters that should be done by now. You can change any of them next.</CardDescription>
      </CardHeader>

      <Field id="batch" label="Your batch (the year you entered)" hint="For example 2024 if you started in AY 2024–25." error={error} nudgeKey={tried}>
        <Input
          id="batch"
          inputMode="numeric"
          placeholder={String(now.getFullYear() - 2)}
          className="max-w-40 tabular"
          value={state.batchYear}
          aria-invalid={!!error}
          onChange={(e) => update((s) => ({ ...s, batchYear: e.target.value }))}
        />
      </Field>

      {preview.length > 0 && (
        <div className="mt-8">
          <div className="flex items-baseline justify-between gap-3">
            <p className="meta-label">Your semesters</p>
            <p className="tabular text-caption text-muted-foreground">
              {preview.filter((s) => s.status === 'done').length} of {preview.length} done
            </p>
          </div>
          <ol className="mt-2 border-t border-border">
            {groupByYear(preview).map((g) => (
              <li key={g.key} className="row-in grid gap-x-6 gap-y-1 border-b border-border py-3 sm:grid-cols-[9rem_1fr]">
                <div className="sm:pt-1.5">
                  <p className="text-body-sm font-medium">{g.year}</p>
                  {g.ay && <p className="tabular text-caption text-muted-foreground">{g.ay}</p>}
                </div>
                <ul>
                  {g.items.map((s) => {
                    const isNow = termKey(s.ay, s.term) === termKey(cur.ay, cur.term)
                    return (
                      <li
                        key={termKey(s.ay, s.term)}
                        className={`-mx-2 flex min-h-9 items-center justify-between gap-3 rounded-md px-2 text-sm ${isNow ? 'bg-maroon-tint/40' : ''}`}
                      >
                        <span className={s.status === 'done' || isNow ? '' : 'text-muted-foreground'}>{termName(s.term)}</span>
                        {s.status === 'done' ? (
                          <Badge tone="green">Done</Badge>
                        ) : isNow ? (
                          <Badge tone="maroon">Now</Badge>
                        ) : (
                          <span className="text-caption text-muted-foreground">Ahead</span>
                        )}
                      </li>
                    )
                  })}
                </ul>
              </li>
            ))}
          </ol>
          {!allPast && (
            <p className="mt-3 text-caption text-muted-foreground">
              Finished this semester already? Mark it as done in the next step. Midyear terms, an extra year or a leave of
              absence can be added there too.
            </p>
          )}
        </div>
      )}

      {allPast && (
        <fieldset className="mt-8" aria-describedby={gradError ? 'graduated-error' : 'graduated-hint'}>
          <legend className="text-lg">Have you graduated?</legend>
          <p id="graduated-hint" className="mt-1 text-caption text-muted-foreground">
            Every semester in your study plan is already past.
          </p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {[
              { v: true, t: 'Yes, I’ve graduated', d: 'Check your final GWA against your transcript.' },
              { v: false, t: 'Not yet', d: 'Plan the semesters you still have, starting this one.' },
            ].map(({ v, t, d }, i) => (
              <label
                key={t}
                className="flex cursor-pointer gap-3 rounded-lg border border-border p-4 transition-colors duration-150 hover:border-border-strong has-[:checked]:border-up-maroon has-[:checked]:bg-maroon-tint/40"
              >
                <input
                  type="radio"
                  name="graduated"
                  checked={state.graduated === v}
                  aria-invalid={i === 0 && !!gradError ? true : undefined}
                  onChange={() => update((s) => ({ ...s, graduated: v }))}
                  className="mt-1 size-4 shrink-0 accent-up-maroon"
                />
                <span>
                  <span className="block text-body-sm font-medium">{t}</span>
                  <span className="block text-caption text-muted-foreground">{d}</span>
                </span>
              </label>
            ))}
          </div>
          {gradError && (
            <p id="graduated-error" className="mt-2 flex items-start gap-1.5 text-caption text-up-maroon">
              <WarningCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
              {gradError}
            </p>
          )}
        </fieldset>
      )}

      <StepNav onBack={onBack} onNext={next} />
    </Card>
  )
}

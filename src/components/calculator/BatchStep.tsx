import { useMemo, useRef, useState } from 'react'
import { Field, StepNav, useFocusFirstInvalid } from './Field'
import { Badge } from '@/components/ui/badge'
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { buildSemesters, currentTerm, semesterLabel, termKey } from '@/lib/state'
import { useStore } from '@/lib/store'
import { batchError } from '@/lib/validate'

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

  const next = () => {
    setTried((n) => n + 1)
    if (batchError(state)) return
    update((s) => ({ ...s, semesters: buildSemesters(s) }))
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
          <p className="meta-label">Your semesters</p>
          <ul className="mt-2 border-t border-border">
            {preview.map((s) => {
              const isNow = termKey(s.ay, s.term) === termKey(cur.ay, cur.term)
              return (
                <li key={termKey(s.ay, s.term)} className="row-in flex items-center justify-between gap-3 border-b border-border py-2.5 text-sm">
                  <span>
                    {semesterLabel(s)}
                    {s.yearLabel && <span className="ml-2 text-muted-foreground">· {s.yearLabel}</span>}
                  </span>
                  {s.status === 'done' ? (
                    <Badge tone="green">Done</Badge>
                  ) : isNow ? (
                    <Badge tone="maroon">Now</Badge>
                  ) : (
                    <Badge>Ahead</Badge>
                  )}
                </li>
              )
            })}
          </ul>
          <p className="mt-3 text-caption text-muted-foreground">
            Finished this semester already? Mark it as done in the next step. Midyear terms, an extra year or a leave of absence
            can be added there too.
          </p>
        </div>
      )}

      <StepNav onBack={onBack} onNext={next} />
    </Card>
  )
}

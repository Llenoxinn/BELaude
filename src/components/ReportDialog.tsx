import { useState, type ReactNode } from 'react'
import { WarningCircle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { REPORT_KEY } from '@/lib/site'

type Phase = 'idle' | 'sending' | 'sent' | 'failed'

export interface ReportSpec {
  title: string
  /** Email subject the developer sees. */
  subject: string
  /** Shown to the student as "What gets sent", and sent as-is. Never grades. */
  facts: [string, string][]
  noteLabel: string
  notePlaceholder: string
  /** A report that is only the note (feedback, a study plan error) can't be sent empty. */
  noteRequired?: boolean
  /** Pre-filled GitHub issue, offered when sending fails. */
  fallbackUrl: string
}

/** Sends a report to the developer through Web3Forms, showing exactly what goes before it goes. */
export function ReportDialog({ open, onClose, spec }: { open: boolean; onClose: () => void; spec: ReportSpec }) {
  const [note, setNote] = useState('')
  const [email, setEmail] = useState('')
  const [phase, setPhase] = useState<Phase>('idle')
  const [noteError, setNoteError] = useState(false)

  const close = () => {
    onClose()
    if (phase === 'sent') {
      setPhase('idle')
      setNote('')
    }
  }

  const send = async () => {
    if (spec.noteRequired && !note.trim()) {
      setNoteError(true)
      document.getElementById('report-note')?.focus()
      return
    }
    setNoteError(false)
    setPhase('sending')
    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: REPORT_KEY,
          subject: spec.subject,
          from_name: 'BELaude report',
          ...Object.fromEntries(spec.facts),
          Note: note.trim() || '(none)',
          ...(email.trim() ? { email: email.trim() } : {}),
        }),
      })
      const data = (await res.json()) as { success?: boolean }
      setPhase(res.ok && data.success ? 'sent' : 'failed')
    } catch {
      setPhase('failed')
    }
  }

  return (
    <Dialog
      open={open}
      onClose={close}
      title={phase === 'sent' ? 'Report sent' : spec.title}
      description={
        phase === 'sent'
          ? 'Thank you. The developer reads every report.'
          : 'This goes to the developer of BELaude. Your grades are not included.'
      }
    >
      {phase === 'sent' ? (
        <div className="mt-6 flex justify-end">
          <Button autoFocus onClick={close}>
            Done
          </Button>
        </div>
      ) : (
        <form
          className="mt-5"
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            if (phase !== 'sending') void send()
          }}
        >
          {spec.facts.length > 0 && (
            <>
              <p className="text-caption font-medium">What gets sent</p>
              <dl className="mt-2 mb-5 divide-y divide-border rounded-md border border-border text-caption">
                {spec.facts.map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4 px-3 py-2">
                    <dt className="text-muted-foreground">{k}</dt>
                    <dd className="text-right tabular">{v}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}

          <Label htmlFor="report-note" className="block">
            {spec.noteLabel} {!spec.noteRequired && <span className="font-normal text-muted-foreground">(optional)</span>}
          </Label>
          <textarea
            id="report-note"
            name="note"
            rows={3}
            maxLength={1000}
            value={note}
            aria-invalid={noteError || undefined}
            aria-describedby={noteError ? 'report-note-error' : undefined}
            onChange={(e) => setNote(e.target.value)}
            placeholder={spec.notePlaceholder}
            className="mt-1.5 w-full rounded-[6px] border border-input bg-background px-3 py-2 text-base placeholder:text-faint focus-visible:border-up-maroon focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-up-maroon aria-invalid:border-up-maroon sm:text-body-sm"
          />
          {noteError && (
            <p id="report-note-error" className="mt-1.5 flex items-start gap-1.5 text-caption text-up-maroon">
              <WarningCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
              Write a few words about what’s wrong.
            </p>
          )}

          <Label htmlFor="report-email" className="mt-4 block">
            Email for a reply <span className="font-normal text-muted-foreground">(optional)</span>
          </Label>
          <Input id="report-email" name="email" type="email" autoComplete="email" className="mt-1.5" value={email} onChange={(e) => setEmail(e.target.value)} />

          {/* Rendered empty first so a failure is announced when it appears */}
          <div role="status" className="mt-3 text-caption">
            {phase === 'failed' && (
              <p className="flex items-start gap-1.5 text-up-maroon">
                <WarningCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
                <span>
                  The report didn’t go through. Check your connection and try again, or{' '}
                  <a className="underline" href={spec.fallbackUrl} target="_blank" rel="noreferrer">
                    report it on GitHub
                  </a>
                  .
                </span>
              </p>
            )}
          </div>

          <div className="mt-4 flex flex-wrap justify-end gap-3">
            <Button type="button" variant="outline" onClick={close}>
              Cancel
            </Button>
            <Button type="submit" aria-disabled={phase === 'sending' || undefined}>
              {phase === 'sending' ? 'Sending…' : 'Send report'}
            </Button>
          </div>
        </form>
      )}
    </Dialog>
  )
}

/**
 * A button that opens the report popup, or, when no Web3Forms key is set, a link to the
 * pre-filled GitHub issue instead.
 */
export function ReportButton({ spec, children, className }: { spec: ReportSpec; children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false)
  if (!REPORT_KEY) {
    return (
      <a href={spec.fallbackUrl} target="_blank" rel="noreferrer" className={className}>
        {children}
        <span className="sr-only"> (opens GitHub in a new tab)</span>
      </a>
    )
  }
  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children}
      </button>
      <ReportDialog open={open} onClose={() => setOpen(false)} spec={spec} />
    </>
  )
}

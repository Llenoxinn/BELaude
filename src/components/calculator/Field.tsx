import { cloneElement, isValidElement, useEffect, useState, type ReactElement, type ReactNode, type RefObject } from 'react'
import { WarningCircle } from '@phosphor-icons/react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/**
 * Label, control, hint and error. The control is linked to its hint or error through
 * aria-describedby; errors use text and an icon, never color alone, and nudge once when shown.
 */
export function Field({
  id,
  label,
  hint,
  error,
  nudgeKey,
  className,
  children,
}: {
  id: string
  label: ReactNode
  hint?: ReactNode
  error?: string | null
  /** Changes whenever the student tries to continue, so the nudge replays. */
  nudgeKey?: number
  className?: string
  children: ReactElement<{ 'aria-describedby'?: string }>
}) {
  const [nudge, setNudge] = useState(false)
  useEffect(() => {
    if (!error || !nudgeKey) return
    setNudge(true)
    const t = setTimeout(() => setNudge(false), 220)
    return () => clearTimeout(t)
  }, [nudgeKey, error])

  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined
  const control = isValidElement(children) ? cloneElement(children, { 'aria-describedby': describedBy }) : children

  return (
    <div className={className}>
      <Label htmlFor={id}>{label}</Label>
      <div className={cn(nudge && 'nudge')}>{control}</div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 flex items-start gap-1.5 text-caption text-up-maroon">
          <WarningCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 text-caption text-muted-foreground">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

/** After a failed attempt to continue, move focus to the first invalid field in the step. */
export function useFocusFirstInvalid(tried: number, scope: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!tried) return
    const first = scope.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
    first?.focus()
  }, [tried, scope])
}

export function StepNav({
  onBack,
  onNext,
  nextLabel = 'Continue',
  error,
}: {
  onBack?: () => void
  onNext: () => void
  nextLabel?: string
  error?: string | null
}) {
  return (
    <div className="mt-10 border-t border-border pt-6">
      {error && (
        <p className="mb-4 flex items-start gap-1.5 text-sm text-up-maroon">
          <WarningCircle aria-hidden className="mt-0.5 size-4 shrink-0" />
          {error}
        </p>
      )}
      <div className="flex items-center justify-between gap-3">
        {onBack ? (
          <Button type="button" variant="ghost" onClick={onBack} className="-ml-3 text-muted-foreground hover:text-foreground">
            Back
          </Button>
        ) : (
          <span />
        )}
        <Button type="button" onClick={onNext}>
          {nextLabel}
        </Button>
      </div>
    </div>
  )
}

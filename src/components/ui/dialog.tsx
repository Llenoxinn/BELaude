import { useEffect, useId, useRef, type ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

/**
 * A modal on the native <dialog>: showModal() makes the page behind it inert, Escape closes it and
 * focus returns to the control that opened it. A click on the backdrop closes it too.
 */
export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  className,
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: ReactNode
  children?: ReactNode
  className?: string
}) {
  const ref = useRef<HTMLDialogElement>(null)
  const id = useId()

  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open && !d.open) d.showModal()
    else if (!open && d.open) d.close()
  }, [open])

  return (
    <dialog
      ref={ref}
      aria-labelledby={`${id}-title`}
      aria-describedby={description ? `${id}-desc` : undefined}
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className={cn(
        'm-auto w-[calc(100%-2rem)] max-w-md rounded-lg border border-border bg-background p-0 text-foreground shadow-lg',
        'backdrop:bg-[rgb(17_17_17/0.4)] open:animate-[pop-in_200ms_var(--ease-out)]',
        className,
      )}
    >
      {/* The inner box takes the clicks, so only the backdrop counts as "outside" */}
      <div className="p-6">
        <h2 id={`${id}-title`} className="text-xl leading-tight">
          {title}
        </h2>
        {description && (
          <div id={`${id}-desc`} className="mt-2 text-body-sm text-muted-foreground">
            {description}
          </div>
        )}
        {children}
      </div>
    </dialog>
  )
}

/** A yes/no question in a Dialog. The safe choice comes first and takes focus. */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  description?: ReactNode
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <Dialog open={open} onClose={onCancel} title={title} description={description}>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <Button variant="outline" autoFocus onClick={onCancel}>
          Cancel
        </Button>
        <Button className="bg-up-maroon hover:bg-accent-hover" onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Dialog>
  )
}

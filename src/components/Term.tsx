import { useRef, useState, type PointerEvent, type ReactNode } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export const GLOSSARY = {
  GWA: 'General Weighted Average: each grade times its units, added up, divided by the total units. Lower is better in UP.',
  INC: 'Incomplete. It isn’t counted until you finish the course, unless you add the grade you expect.',
  NSTP: 'National Service Training Program. NSTP doesn’t count toward your GWA.',
  PE: 'Physical Education (PE or HK). PE doesn’t count toward your GWA.',
  DRP: 'Dropped. Not counted in your GWA.',
  units: 'Only units that count in your GWA. Leave out NSTP and PE.',
} as const

/**
 * A term with a plain-language definition. Opens on hover with a mouse, and on tap, click or
 * Enter, so it works on phones and keyboards too.
 */
export function Term({ children, tip }: { children: ReactNode; tip: string }) {
  const [open, setOpen] = useState(false)
  const closeTimer = useRef(0)
  const hovering = useRef(false)
  // Mouse only: touch fires pointerenter on tap, which would fight the click toggle.
  const hover = (next: boolean) => (e: PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    hovering.current = next
    window.clearTimeout(closeTimer.current)
    // A short grace period lets the pointer cross the gap into the definition.
    if (next) setOpen(true)
    else closeTimer.current = window.setTimeout(() => setOpen(false), 120)
  }
  // A click while hovering keeps it open instead of toggling it shut.
  return (
    <Popover open={open} onOpenChange={(next) => setOpen(next || hovering.current)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onPointerEnter={hover(true)}
          onPointerLeave={hover(false)}
          className="cursor-pointer underline decoration-faint decoration-dotted underline-offset-[3px] hover:decoration-up-maroon data-[state=open]:decoration-up-maroon"
        >
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent
        onPointerEnter={hover(true)}
        onPointerLeave={hover(false)}
        onOpenAutoFocus={(e) => e.preventDefault()}
        onEscapeKeyDown={() => (hovering.current = false)}
      >
        {tip}
      </PopoverContent>
    </Popover>
  )
}

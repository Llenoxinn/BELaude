import type { ReactNode } from 'react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

export const GLOSSARY = {
  GWA: 'General Weighted Average: each grade times its units, added up, divided by the total units. Lower is better in UP.',
  INC: 'Incomplete. It isn’t counted until you finish the course, unless you add the grade you expect.',
  NSTP: 'National Service Training Program. NSTP doesn’t count toward your GWA.',
  PE: 'Physical Education (PE or HK). PE doesn’t count toward your GWA.',
  DRP: 'Dropped. Not counted in your GWA.',
  units: 'Only units that count in your GWA. Leave out NSTP and PE.',
} as const

/** A term with a plain-language definition. Opens on tap or click, so it works on phones too. */
export function Term({ children, tip }: { children: ReactNode; tip: string }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="cursor-help underline decoration-faint decoration-dotted underline-offset-[3px] hover:decoration-up-maroon data-[state=open]:decoration-up-maroon"
        >
          {children}
        </button>
      </PopoverTrigger>
      <PopoverContent>{tip}</PopoverContent>
    </Popover>
  )
}

import * as React from 'react'
import { CaretDown } from '@phosphor-icons/react'
import { cn } from '@/lib/utils'

/** A styled native select: the most thumb-friendly picker on phones. */
function NativeSelect({ className, children, ...props }: React.ComponentProps<'select'>) {
  return (
    <div className={cn('relative', className)}>
      <select
        data-slot="native-select"
        className={cn(
          'h-11 w-full appearance-none rounded-[6px] border border-input bg-background pr-9 pl-3 text-base sm:text-body-sm transition-[border-color] duration-150 sm:h-10',
          'focus-visible:border-up-maroon focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-up-maroon',
          'aria-invalid:border-up-maroon disabled:cursor-not-allowed disabled:bg-surface-alt disabled:text-faint',
        )}
        {...props}
      >
        {children}
      </select>
      <CaretDown aria-hidden className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
}

export { NativeSelect }

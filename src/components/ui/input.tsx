import * as React from 'react'
import { cn } from '@/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        'h-11 w-full min-w-0 rounded-[6px] border border-input bg-background px-3 text-base sm:text-body-sm transition-[border-color] duration-150 placeholder:text-faint sm:h-10',
        'focus-visible:border-up-maroon focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-up-maroon',
        'aria-invalid:border-up-maroon aria-invalid:text-up-maroon',
        'disabled:cursor-not-allowed disabled:bg-surface-alt disabled:text-faint',
        className,
      )}
      {...props}
    />
  )
}

export { Input }

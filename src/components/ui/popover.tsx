import * as React from 'react'
import { Popover as PopoverPrimitive } from 'radix-ui'
import { cn } from '@/lib/utils'

function Popover(props: React.ComponentProps<typeof PopoverPrimitive.Root>) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />
}

function PopoverTrigger(props: React.ComponentProps<typeof PopoverPrimitive.Trigger>) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />
}

/** Scales in from its trigger (origin-aware), exits faster than it enters. */
function PopoverContent({ className, sideOffset = 6, ...props }: React.ComponentProps<typeof PopoverPrimitive.Content>) {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        data-slot="popover-content"
        sideOffset={sideOffset}
        collisionPadding={16}
        className={cn(
          'z-50 max-w-72 rounded-md border border-border bg-background px-3.5 py-2.5 text-caption text-foreground',
          'origin-(--radix-popover-content-transform-origin)',
          'data-[state=open]:animate-[pop-in_150ms_var(--ease-out)] data-[state=closed]:animate-[pop-out_100ms_var(--ease-out)]',
          className,
        )}
        {...props}
      />
    </PopoverPrimitive.Portal>
  )
}

export { Popover, PopoverTrigger, PopoverContent }

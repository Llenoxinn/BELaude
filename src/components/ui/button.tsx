import * as React from 'react'
import { Slot } from 'radix-ui'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[6px] text-sm font-medium transition-[background-color,border-color,color,scale] duration-150 ease-out not-disabled:active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary-hover',
        accent: 'bg-up-maroon text-white hover:bg-accent-hover',
        outline: 'border border-border bg-background hover:border-up-maroon hover:text-up-maroon',
        mono: 'border border-foreground bg-background hover:border-up-maroon hover:text-up-maroon',
        ghost: 'hover:bg-surface-alt',
        link: 'h-auto px-0 text-up-maroon underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-5 sm:h-10',
        sm: 'h-9 px-3 text-caption',
        lg: 'h-12 px-6 text-base',
        icon: 'size-11 sm:size-10',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'button'
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />
}

export { Button, buttonVariants }

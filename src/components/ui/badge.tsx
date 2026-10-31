import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

// design.md 1.4: green = on track, gold = stretch, maroon = highlight, neutral gray + maroon text = out of reach.
const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-caption font-medium whitespace-nowrap',
  {
    variants: {
      tone: {
        maroon: 'bg-maroon-tint text-up-maroon',
        green: 'bg-green-tint text-up-green',
        gold: 'bg-gold-tint text-gold-ink',
        neutral: 'bg-neutral-tint text-up-maroon',
        outline: 'border border-border text-muted-foreground',
      },
    },
    defaultVariants: { tone: 'outline' },
  },
)

function Badge({ className, tone, ...props }: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants>) {
  return <span data-slot="badge" className={cn(badgeVariants({ tone }), className)} {...props} />
}

export { Badge, badgeVariants }

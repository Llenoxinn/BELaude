import { useId } from 'react'
import { cn } from '@/lib/utils'

/**
 * The border band of the UP sablay, shrunk to a thin line: a zigzag of navy triangles with small gold
 * diamonds between them, held by two maroon hairlines. Used sparingly, where a plain rule would go.
 */
export function SablayLine({ className }: { className?: string }) {
  const id = useId()
  return (
    <svg aria-hidden className={cn('block h-2.5 w-full', className)}>
      <defs>
        <pattern id={id} width="12" height="10" patternUnits="userSpaceOnUse">
          <rect width="12" height="1" fill="var(--up-maroon)" />
          <rect y="9" width="12" height="1" fill="var(--up-maroon)" />
          <path d="M0 2.5h6l-3 5zM6 7.5h6l-3-5z" fill="var(--sablay-navy)" />
          <path d="M6 3.4l1.3 1.6L6 6.6 4.7 5z" fill="var(--logo-gold)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${id})`} />
    </svg>
  )
}

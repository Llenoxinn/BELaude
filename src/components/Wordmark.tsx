import type { CSSProperties } from 'react'
import { cn } from '@/lib/utils'

const LINES: { text: string; style: CSSProperties; className: string }[] = [
  { text: 'BE LOUD', style: { '--wm-bg': 'var(--up-maroon)' } as CSSProperties, className: 'text-white' },
  { text: 'BE A', style: { '--wm-bg': 'var(--up-green)' } as CSSProperties, className: 'text-white' },
  // Maroon, green, gold: UP's colours, ending on the gold of the honor itself
  { text: 'LAUDE', style: { '--wm-bg': 'var(--up-gold)' } as CSSProperties, className: 'text-up-black' },
]

/**
 * The stacked highlighted wordmark (design.md 2b). Each line sits on its own block and types in
 * on first load. Used only in the hero, the header and the share card.
 */
export function Wordmark({ size = 'lg', animate = true, className }: { size?: 'sm' | 'lg'; animate?: boolean; className?: string }) {
  return (
    <span
      role="img"
      aria-label="BELaude: be loud, be a laude"
      className={cn('inline-flex flex-col items-start font-pixel leading-none', !animate && 'wm-static', className)}
    >
      {LINES.map((line, i) => (
        <span
          key={line.text}
          aria-hidden
          className={cn('wm-line', size === 'lg' ? 'px-3 py-2 text-[2.0625rem] sm:text-[2.75rem]' : 'px-1.5 py-1 text-pixel', line.className, 'leading-none')}
          style={{ ...line.style, '--i': i } as CSSProperties}
        >
          <span>{line.text}</span>
        </span>
      ))}
    </span>
  )
}

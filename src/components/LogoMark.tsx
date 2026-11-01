import { cn } from '@/lib/utils'

const PETALS = Array.from({ length: 8 }, (_, i) => {
  const a = (i * Math.PI) / 4
  return [16 + 9.6 * Math.sin(a), 16 - 9.6 * Math.cos(a)]
})
const SEEDS = [
  [14.5, 14.5],
  [17.5, 14.5],
  [14.5, 17.5],
  [17.5, 17.5],
]

/** The app icon (public/favicon.svg): a sunflower in dots, eight gold petals around a seed disk. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn('shrink-0', className)}>
      <rect width="32" height="32" rx="8" fill="var(--up-maroon)" />
      {PETALS.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={3.3} fill="var(--up-gold)" />
      ))}
      <circle cx={16} cy={16} r={5.4} fill="#4a0a1c" />
      {SEEDS.map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r={1} fill="var(--up-gold)" />
      ))}
    </svg>
  )
}

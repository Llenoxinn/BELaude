import { cn } from '@/lib/utils'

// Same drawing as public/favicon.svg: a broad petal from the centre outward, pointing up.
const PETAL = 'M16 16C11.6 12.4 12.4 5.2 16 2.4C19.6 5.2 20.4 12.4 16 16Z'
const BACK = Array.from({ length: 8 }, (_, i) => 22.5 + i * 45)
const FRONT = Array.from({ length: 8 }, (_, i) => i * 45)
// Seeds on the golden angle, the spiral real sunflower heads grow in
const GOLDEN = Math.PI * (3 - Math.sqrt(5))
const SEEDS = Array.from({ length: 25 }, (_, k) => {
  const i = k + 1
  return [16 + Math.sqrt(i) * Math.cos(i * GOLDEN), 16 + Math.sqrt(i) * Math.sin(i * GOLDEN)]
})

/** The app icon: two rings of gold petals around a maroon seed disk. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden className={cn('shrink-0', className)}>
      <g fill="#d48c06">
        {BACK.map((a) => (
          <path key={a} d={PETAL} transform={`rotate(${a} 16 16)`} />
        ))}
      </g>
      <g fill="var(--up-gold)">
        {FRONT.map((a) => (
          <path key={a} d={PETAL} transform={`rotate(${a} 16 16)`} />
        ))}
      </g>
      <circle cx={16} cy={16} r={7} fill="#6f0f2a" />
      <g fill="var(--up-gold)" fillOpacity={0.8}>
        {SEEDS.map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r={0.6} />
        ))}
      </g>
    </svg>
  )
}

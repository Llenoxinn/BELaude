import { cn } from '@/lib/utils'

export const STEP_NAMES = ['Program', 'Batch', 'Grades', 'Results']

/** Four segments that fill in black as you go, each with its step name beneath. */
export function Stepper({ current, max, onSelect }: { current: number; max: number; onSelect: (step: number) => void }) {
  return (
    <nav aria-label="Calculator steps">
      <ol className="grid grid-cols-4 gap-2">
        {STEP_NAMES.map((name, i) => {
          const state = i === current ? 'current' : i < current ? 'done' : 'todo'
          return (
            <li key={name}>
              <button
                type="button"
                disabled={i > max}
                aria-current={i === current ? 'step' : undefined}
                onClick={() => onSelect(i)}
                className="group flex min-h-11 w-full flex-col items-start gap-2 text-left disabled:cursor-not-allowed"
              >
                <span
                  aria-hidden
                  className={cn('h-1 w-full rounded-full transition-colors duration-300', state === 'todo' ? 'bg-border' : 'bg-up-black')}
                />
                <span className={cn('text-caption', state === 'current' ? 'font-semibold text-foreground' : 'text-muted-foreground group-disabled:text-faint')}>
                  <span className="tabular">{i + 1}</span> <span className="ml-0.5">{name}</span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

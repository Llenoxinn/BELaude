import { cn } from '@/lib/utils'

export const STEP_NAMES = ['Program', 'Batch', 'Grades', 'Results']

/** Numbered steps with a thin progress line; the current step fills maroon. */
export function Stepper({ current, max, onSelect }: { current: number; max: number; onSelect: (step: number) => void }) {
  return (
    <nav aria-label="Calculator steps">
      <ol className="relative grid grid-cols-4">
        <span aria-hidden className="absolute top-4 right-[12.5%] left-[12.5%] h-px bg-border" />
        <span
          aria-hidden
          className="absolute top-4 left-[12.5%] h-px w-[75%] origin-left bg-up-maroon transition-transform duration-300"
          style={{ transform: `scaleX(${current / (STEP_NAMES.length - 1)})` }}
        />
        {STEP_NAMES.map((name, i) => {
          const state = i === current ? 'current' : i < current ? 'done' : 'todo'
          return (
            <li key={name} className="relative flex justify-center">
              <button
                type="button"
                disabled={i > max}
                aria-current={i === current ? 'step' : undefined}
                onClick={() => onSelect(i)}
                className="group flex min-h-11 flex-col items-center gap-1.5 disabled:cursor-not-allowed"
              >
                <span
                  className={cn(
                    'flex size-8 items-center justify-center rounded-full border text-caption font-semibold tabular transition-colors duration-300',
                    state === 'current' && 'border-up-maroon bg-up-maroon text-white',
                    state === 'done' && 'border-up-maroon bg-background text-up-maroon',
                    state === 'todo' && 'border-border bg-background text-faint',
                  )}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span className={cn('text-caption', state === 'current' ? 'font-medium text-foreground' : 'text-muted-foreground group-disabled:text-faint')}>
                  {name}
                </span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

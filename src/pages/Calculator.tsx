import { BatchStep } from '@/components/calculator/BatchStep'
import { DataBar } from '@/components/calculator/DataBar'
import { GradesStep } from '@/components/calculator/GradesStep'
import { ProgramStep } from '@/components/calculator/ProgramStep'
import { ResultsView } from '@/components/calculator/Results'
import { Stepper } from '@/components/calculator/Stepper'
import { buildSemesters } from '@/lib/state'
import { useStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { maxStep } from '@/lib/validate'
import { useEffect, useRef } from 'react'

export function Calculator() {
  const { state, update } = useStore()
  const max = maxStep(state)
  const step = Math.min(state.step, max)

  // Each step remounts; move focus to its heading so keyboard and screen-reader users land on it.
  const shown = useRef(step)
  useEffect(() => {
    if (shown.current === step) return
    shown.current = step
    requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-step-title]')?.focus({ preventScroll: true }))
  }, [step])

  const go = (n: number) => {
    // Jumping from the program or batch step straight to grades or results keeps the semester list in sync.
    update((s) => ({ ...s, step: n, semesters: step < 2 && n >= 2 ? buildSemesters(s) : s.semesters }))
    window.scrollTo({ top: 0 })
  }

  return (
    // The grades step widens on laptops so two semesters fit side by side
    <main id="main" tabIndex={-1} className={cn('mx-auto max-w-3xl px-4 pt-8 sm:px-6 sm:pt-12', step === 2 && 'lg:max-w-6xl')}>
      <div className="mx-auto max-w-3xl">
        <Stepper current={step} max={max} onSelect={go} />
      </div>
      <div key={step} className="step-in mt-8 sm:mt-10">
        {step === 0 && <ProgramStep onNext={() => go(1)} />}
        {step === 1 && <BatchStep onBack={() => go(0)} onNext={() => go(2)} />}
        {step === 2 && <GradesStep onBack={() => go(1)} onNext={() => go(3)} />}
        {step === 3 && <ResultsView onEdit={go} />}
      </div>
      <DataBar />
    </main>
  )
}

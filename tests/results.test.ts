import { describe, expect, it } from 'vitest'
import { computeResults } from '@/lib/results'
import { blankSemester, initialState, type AppState, type Term } from '@/lib/state'

const now = new Date(2026, 9, 31)

/** Custom program of 150 units: one finished block of 60 units at `avg`, then five 18-unit semesters. */
function stateWith(avg: string, total = '150', upcoming = 5): AppState {
  const done = blankSemester(2024, 1, now, { status: 'done', mode: 'gwa', gwa: avg, units: '60' })
  const rest = Array.from({ length: upcoming }, (_, i) =>
    blankSemester(2025 + Math.floor(i / 2), ((i % 2) + 1) as Term, now, { status: 'upcoming', plannedUnits: '18' }),
  )
  return { ...initialState, campusId: 'other', custom: { totalUnits: total, semesters: '8' }, semesters: [done, ...rest] }
}

describe('computeResults headline state (plan.md 4b)', () => {
  it('top tier reachable: worked example plans for magna, cum laude as safety net', () => {
    const r = computeResults(stateWith('1.50'))
    expect(r.state).toBe('top')
    expect(r.main?.tier.id).toBe('magna')
    expect(r.safety?.tier.id).toBe('cum')
    expect(r.tiers[0].status).toBe('theoretical')
    expect(r.focus?.plan.semesters).toHaveLength(5)
    expect(r.focus?.plan.semesters.every((s) => s.units === 18)).toBe(true)
    expect(r.unitsAdjusted).toBe(false)
  })

  it('summa slipping away alone does not lead the headline', () => {
    const r = computeResults(stateWith('1.60'))
    expect(r.tiers[0].status).toBe('out')
    expect(r.state).toBe('top')
    expect(r.main?.tier.id).toBe('magna')
  })

  it('only a lower tier reachable', () => {
    const r = computeResults(stateWith('2.20'))
    expect(r.state).toBe('lower')
    expect(r.main?.tier.id).toBe('cum')
  })

  it('stretch: magna needs about 1.05, cum laude is the safer target', () => {
    const r = computeResults(stateWith('2.05'))
    expect(r.state).toBe('stretch')
    expect(r.stretch?.tier.id).toBe('magna')
    expect(r.main?.tier.id).toBe('cum')
  })

  it('no honors reachable still gives a best possible GWA', () => {
    const r = computeResults(stateWith('3.00'))
    expect(r.state).toBe('none')
    expect(r.main).toBeNull()
    expect(r.bestFinal).toBeCloseTo((180 + 90) / 150, 10)
  })

  it('done: no units left reports the tier achieved', () => {
    const r = computeResults(stateWith('1.50', '60', 0))
    expect(r.state).toBe('done')
    expect(r.main?.tier.id).toBe('cum')
  })

  it('lets the student focus on another attainable tier', () => {
    const r = computeResults({ ...stateWith('1.50'), focusTier: 'cum' })
    expect(r.focus?.tier.id).toBe('cum')
  })

  it('rescales planned loads that do not match the remaining units', () => {
    const s = stateWith('1.50')
    s.semesters[1].plannedUnits = '21'
    const r = computeResults(s)
    expect(r.unitsAdjusted).toBe(true)
    expect(r.upcoming.reduce((a, u) => a + u.units, 0)).toBe(90)
  })

  it('flags more completed units than the program total', () => {
    expect(computeResults(stateWith('1.50', '50', 0)).errors.length).toBeGreaterThan(0)
  })
})

describe('underload and pending grades', () => {
  it('flags regular semesters below a regular load, done or planned', () => {
    const s = stateWith('1.50')
    s.semesters[1].plannedUnits = '9'
    const r = computeResults(s)
    expect(r.underload.done.map((d) => d.label)).toEqual([])
    expect(r.underload.upcoming).toHaveLength(1)
  })

  it('counts a 5.00 like any grade and flags a light semester', () => {
    const s = stateWith('1.50')
    s.semesters[0] = {
      ...s.semesters[0],
      mode: 'courses',
      courses: [
        { id: 'a', code: 'MATH 21', title: '', units: '3', grade: '5.00', expectedGrade: '' },
        { id: 'b', code: 'CMSC 11', title: '', units: '3', grade: 'INC', expectedGrade: '' },
      ],
    }
    const r = computeResults(s)
    expect(r.pendingInc).toBe(1)
    expect(r.underload.done).toHaveLength(1)
    expect(r.cumulativeGwa).toBe(5)
  })
})

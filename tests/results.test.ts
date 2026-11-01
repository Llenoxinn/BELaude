import { describe, expect, it } from 'vitest'
import { computeResults, unitsTally } from '@/lib/results'
import { applyGraduated, blankSemester, buildSemesters, initialState, parseImport, type AppState, type Term } from '@/lib/state'

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

describe('graduates', () => {
  it('a graduate with fewer units than the study plan still gets a final GWA', () => {
    const r = computeResults({ ...stateWith('1.40', '150', 0), graduated: true })
    expect(r.errors).toEqual([])
    expect(r.state).toBe('done')
    expect(r.cumulativeGwa).toBeCloseTo(1.4)
    expect(r.main?.tier.id).toBe('magna')
  })

  it('a graduate with more units than the study plan is not blocked', () => {
    const r = computeResults({ ...stateWith('1.40', '50', 0), graduated: true })
    expect(r.errors).toEqual([])
    expect(r.state).toBe('done')
  })

  it('a student who has not graduated still needs semesters ahead', () => {
    const r = computeResults({ ...stateWith('1.40', '150', 0), graduated: false })
    expect(r.errors.join(' ')).toMatch(/no semesters ahead/)
  })
})

describe('applyGraduated', () => {
  const past = [blankSemester(2022, 1, now, { status: 'done' }), blankSemester(2022, 2, now, { status: 'done' })]

  it('a student still studying gets the term in progress as a semester ahead', () => {
    const list = applyGraduated(past, false, 2022, now)
    expect(list).toHaveLength(3)
    expect(list[2]).toMatchObject({ ay: 2026, term: 1, status: 'upcoming', extra: true, yearLabel: '5th year, 1st sem' })
  })

  it('does not add a second semester ahead', () => {
    const once = applyGraduated(past, false, 2022, now)
    expect(applyGraduated(once, false, 2022, now)).toHaveLength(3)
  })

  it('a graduate drops empty semesters ahead', () => {
    expect(applyGraduated(applyGraduated(past, false, 2022, now), true, 2022, now)).toHaveLength(2)
  })
})

describe('own numbers (no study plan)', () => {
  const own = { ...initialState, campusId: 'other', custom: { totalUnits: '155', semesters: '8' }, batchYear: '2024' }

  it('splits the total into whole units that add up', () => {
    const list = buildSemesters(own, now)
    const planned = list.map((s) => Number(s.plannedUnits))
    expect(planned.every(Number.isInteger)).toBe(true)
    expect(planned.reduce((a, b) => a + b, 0)).toBe(155)
  })

  it('leaves a finished semester’s units for the student to enter', () => {
    const list = buildSemesters(own, now)
    expect(list.filter((s) => s.status === 'done').every((s) => s.units === '')).toBe(true)
  })
})

describe('changing the batch year', () => {
  it('relabels a kept semester from an earlier batch (2025, then 2022)', () => {
    const base = { ...initialState, campusId: 'other', custom: { totalUnits: '144', semesters: '8' } }
    const first = buildSemesters({ ...base, batchYear: '2025' }, now)
    const ahead = first.find((s) => s.ay === 2026 && s.term === 1)!
    expect(ahead.yearLabel).toBe('2nd year, 1st sem')
    const kept = first.map((s) => (s.id === ahead.id ? { ...s, extra: true } : s))
    const again = buildSemesters({ ...base, batchYear: '2022', semesters: kept }, now)
    expect(again.find((s) => s.ay === 2026 && s.term === 1)?.yearLabel).toBe('5th year, 1st sem')
  })
})

describe('units filled in by BELaude', () => {
  const base = { ...initialState, campusId: 'other', custom: { totalUnits: '155', semesters: '8' }, batchYear: '2024' }

  it('follow the study plan once a program is picked, but typed units stay', () => {
    const own = buildSemesters(base, now)
    const typed = own.map((s, i) => (i === 0 ? { ...s, units: '21', unitsAuto: false } : s))
    const withPlan = buildSemesters({ ...base, campusId: 'upc', programId: 'bs-biology', semesters: typed }, now)
    expect(withPlan[0].units).toBe('21')
    expect(withPlan[1].units).toBe('18')
    expect(withPlan.slice(2).every((s) => Number.isInteger(Number(s.plannedUnits)))).toBe(true)
  })

  it('an old save holding 19.38 is treated as a guess', () => {
    const old = { ...base, campusId: 'upc', programId: 'bs-biology', semesters: [blankSemester(2024, 1, now, { status: 'done', units: '19.38' })] }
    const parsed = parseImport(JSON.stringify(old))
    expect(parsed.semesters[0].unitsAuto).toBe(true)
    expect(buildSemesters(parsed, now)[0].units).not.toBe('19.38')
  })
})

describe('unitsTally', () => {
  it('adds finished and planned units against the program total', () => {
    const t = unitsTally(stateWith('1.50', '150', 5)) // 60 done + 5 × 18 planned
    expect(t).toMatchObject({ done: 60, planned: 90, sum: 150, total: 150, matches: true })
  })

  it('flags a total the semesters do not add up to', () => {
    const t = unitsTally(stateWith('1.50', '155', 5))
    expect(t.sum).toBe(150)
    expect(t.matches).toBe(false)
  })
})

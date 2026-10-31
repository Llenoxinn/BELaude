import { describe, expect, it } from 'vitest'
import {
  cumulative,
  distributeUnits,
  finalGwa,
  floorTarget,
  gradeMix,
  officialGwa,
  requiredAverage,
  scenarios,
  semestralStanding,
  semesterTargets,
  semesterTotals,
  tierForGwa,
  tierStatus,
} from '@/lib/gwa'
import { classifyCourse, excludedByCode, rules } from '@/lib/rules'

// plan.md section 3: T = 150, 60 units done at 1.50 (P = 90), R = 90
const T = 150
const U = 60
const P = 90
const R = 90

describe('requiredAverage (plan.md worked example)', () => {
  it('summa needs every grade to be 1.00', () => {
    const r = requiredAverage(1.2, T, P, R)
    expect(r).toBeCloseTo(1.0, 10)
    expect(tierStatus(r)).toBe('theoretical')
  })

  it('magna needs 1.4167, shown as 1.41 so hitting it keeps magna', () => {
    const r = requiredAverage(1.45, T, P, R)
    expect(r).toBeCloseTo(127.5 / 90, 10)
    expect(floorTarget(r)).toBe(1.41)
    expect(tierStatus(r)).toBe('reachable')
    // averaging the shown target keeps the tier; rounding up to 1.42 would not
    expect(tierForGwa(finalGwa(P, U, R, 1.41))?.id).toBe('magna')
    expect(tierForGwa(finalGwa(P, U, R, 1.42))?.id).toBe('cum')
  })

  it('cum laude needs 1.9167, shown as 1.91', () => {
    const r = requiredAverage(1.75, T, P, R)
    expect(floorTarget(r)).toBe(1.91)
  })

  it('best possible final GWA is (P + 1.00 x R) / T', () => {
    expect(finalGwa(P, U, R, 1)).toBeCloseTo(1.2, 10)
  })
})

describe('tierStatus', () => {
  it.each([
    [5.2, 'locked'],
    [3.1, 'reachable'],
    [1.42, 'reachable'],
    [1.1, 'stretch'],
    [1.04, 'stretch'],
    [1.0, 'theoretical'],
    [0.98, 'out'],
  ])('required %s is %s', (required, status) => {
    expect(tierStatus(required)).toBe(status)
  })
})

describe('tierForGwa uses 4 decimals', () => {
  it.each([
    [1.2, 'summa'],
    [1.2001, 'magna'],
    [1.45, 'magna'],
    [1.45004, 'magna'],
    [1.4501, 'cum'],
    [1.75, 'cum'],
    [1.7501, null],
  ])('%s is %s', (gwa, id) => {
    expect(tierForGwa(gwa)?.id ?? null).toBe(id)
  })

  it('officialGwa rounds to 4 decimals', () => {
    expect(officialGwa(1.45004)).toBe(1.45)
    expect(officialGwa(1.45005)).toBe(1.4501)
  })
})

describe('floorTarget', () => {
  it('avoids floating point traps', () => {
    expect(floorTarget(1.15)).toBe(1.15)
    expect(floorTarget(1.45)).toBe(1.45)
    expect(floorTarget(1.4599)).toBe(1.45)
  })
})

describe('course classification', () => {
  it('excludes NSTP, PE, HK, Residency and 199/299/399 by code', () => {
    expect(excludedByCode('NSTP 1')).toBe('NSTP')
    expect(excludedByCode('PE 2')).toBe('PE')
    expect(excludedByCode('P.E. 1')).toBe('PE')
    expect(excludedByCode('HK 11')).toBe('HK')
    expect(excludedByCode('Residency')).toBe('Residency')
    expect(excludedByCode('CMSC 199')).toBe('199 course')
    expect(excludedByCode('PED 101')).toBeNull()
    expect(excludedByCode('PHILO 1')).toBeNull()
    expect(excludedByCode('CMSC 21')).toBeNull()
  })

  it('handles special grades', () => {
    expect(classifyCourse({ code: 'MATH 21', units: 3, grade: 'DRP' }).kind).toBe('excluded')
    expect(classifyCourse({ code: 'MATH 21', units: 3, grade: 'P' }).kind).toBe('excluded')
    expect(classifyCourse({ code: 'MATH 21', units: 3, grade: 'INC' })).toEqual({ kind: 'pending', reason: 'inc' })
    expect(classifyCourse({ code: 'MATH 21', units: 3, grade: 'INC', expectedGrade: '1.50' })).toEqual({
      kind: 'counted',
      grade: 1.5,
      units: 3,
      viaExpected: true,
    })
    expect(classifyCourse({ code: 'MATH 21', units: 3, grade: '5.00' })).toMatchObject({ kind: 'counted', grade: 5 })
    expect(classifyCourse({ code: 'MATH 21', units: 0, grade: '1.00' }).kind).toBe('invalid')
    expect(classifyCourse({ code: 'MATH 21', units: null, grade: '1.00' }).kind).toBe('invalid')
  })

  it('lets prospectus data override the code patterns', () => {
    expect(classifyCourse({ code: 'BIO 11', units: 3, grade: '1.00', countsInGWA: false }).kind).toBe('excluded')
  })
})

describe('semesterTotals and cumulative', () => {
  it('computes a semester GWA from courses, skipping NSTP and PE', () => {
    const t = semesterTotals({
      mode: 'courses',
      courses: [
        { code: 'CMSC 11', units: 3, grade: '1.00' },
        { code: 'MATH 21', units: 3, grade: '2.00' },
        { code: 'PE 1', units: 2, grade: '1.00' },
        { code: 'NSTP 1', units: 3, grade: '1.25' },
      ],
    })
    expect(t.units).toBe(6)
    expect(t.gwa).toBeCloseTo(1.5, 10)
  })

  it('accepts a semester GWA directly', () => {
    const t = semesterTotals({ mode: 'gwa', gwa: 1.5, units: 18 })
    expect(t.points).toBe(27)
  })

  it('counts a thesis S at the final grade of the same course (3 S + 3 at 1.75 = 6 at 1.75)', () => {
    const first = semesterTotals({ mode: 'courses', courses: [{ code: 'CMSC 200', units: 3, grade: 'S' }] })
    const second = semesterTotals({ mode: 'courses', courses: [{ code: 'CMSC 200', units: 3, grade: '1.75' }] })
    expect(first.gwa).toBeNull()
    const c = cumulative([first, second])
    expect(c.units).toBe(6)
    expect(c.gwa).toBeCloseTo(1.75, 10)
    expect(c.unresolvedThesisUnits).toBe(0)
  })

  it('leaves a thesis S pending until the final grade is entered', () => {
    const first = semesterTotals({ mode: 'courses', courses: [{ code: 'CMSC 190-1', units: 3, grade: 'S' }] })
    expect(cumulative([first]).unresolvedThesisUnits).toBe(3)
  })
})

describe('distributeUnits', () => {
  it('keeps nominal loads when they already add up', () => {
    expect(distributeUnits(90, [18, 18, 18, 18, 18])).toEqual([18, 18, 18, 18, 18])
  })

  it('scales to the exact remaining total in whole units', () => {
    const out = distributeUnits(10, [3, 3, 3])
    expect(out.reduce((a, b) => a + b, 0)).toBe(10)
    expect(out.every(Number.isInteger)).toBe(true)
  })

  it('splits evenly when there is no nominal load', () => {
    expect(distributeUnits(36, [0, 0])).toEqual([18, 18])
  })
})

describe('semesterTargets (flexible budget)', () => {
  const plan = [1, 2, 3, 4, 5].map((i) => ({ id: `s${i}`, units: 18, planned: null as number | null }))

  it('gives every semester the required average by default', () => {
    const t = semesterTargets(1.45, T, P, plan)
    expect(t.required).toBeCloseTo(127.5 / 90, 10)
    expect(t.semesters.every((s) => Math.abs(s.target - 127.5 / 90) < 1e-9)).toBe(true)
  })

  it('relaxes the rest when one semester is planned better (plan.md: 1.25 next sem)', () => {
    const t = semesterTargets(1.45, T, P, plan.map((s, i) => (i === 0 ? { ...s, planned: 1.25 } : s)))
    expect(t.required).toBeCloseTo(105 / 72, 10)
    expect(t.semesters[0]).toMatchObject({ planned: true, target: 1.25 })
  })

  it('reports the final GWA when every semester is planned', () => {
    const t = semesterTargets(1.45, T, P, plan.map((s) => ({ ...s, planned: 1.5 })))
    expect(t.required).toBeNull()
    expect(t.finalIfPlanned).toBeCloseTo(1.5, 10)
  })
})

describe('gradeMix', () => {
  it('describes 1.4167 as a mix of 1.25s and 1.50s, about a third at 1.25', () => {
    const mix = gradeMix(127.5 / 90)
    expect(mix).toMatchObject({ kind: 'mix', better: 1.25, worse: 1.5 })
    if (mix.kind === 'mix') expect(mix.betterShare).toBeCloseTo(1 / 3, 5)
  })

  it('handles exact steps and the edges', () => {
    expect(gradeMix(1.75)).toEqual({ kind: 'all', grade: 1.75 })
    expect(gradeMix(3.4)).toEqual({ kind: 'passing' })
    expect(gradeMix(0.9)).toEqual({ kind: 'out' })
  })
})

describe('scenarios', () => {
  const history = [
    { units: 18, points: 18 * 1.75 },
    { units: 18, points: 18 * 1.5 },
    { units: 12, points: 12 * 1.25 },
    { units: 12, points: 12 * 1.25 },
  ]
  const points = history.reduce((a, h) => a + h.points, 0)
  const units = 60

  it('builds best, optimistic, likely, pessimistic, cliff and worst', () => {
    const list = scenarios({
      points,
      units,
      remaining: 90,
      history,
      cliff: { tier: rules.latinHonors[1], required: requiredAverage(1.45, 150, points, 90) },
    })
    expect(list.map((s) => s.id)).toEqual(['best', 'optimistic', 'likely', 'pessimistic', 'cliff', 'worst'])
    const byId = Object.fromEntries(list.map((s) => [s.id, s]))
    expect(byId.optimistic.average).toBeCloseTo(1.25, 10)
    expect(byId.likely.average).toBeCloseTo(1.25, 10)
    expect(byId.pessimistic.average).toBeCloseTo(1.5, 10)
    expect(byId.cliff.final).toBeCloseTo(1.45, 10)
    expect(byId.cliff.tier?.id).toBe('magna')
    expect(byId.worst.average).toBe(3)
  })

  it('leaves history-based scenarios empty with no history', () => {
    const list = scenarios({ points: 0, units: 0, remaining: 150, history: [], cliff: null })
    expect(list.find((s) => s.id === 'optimistic')?.final).toBeNull()
    expect(list.find((s) => s.id === 'best')?.final).toBe(1)
  })
})

describe('semestralStanding', () => {
  it('needs a regular load and no failing grade', () => {
    expect(semestralStanding(1.4, 18, 'regular', false)).toBe('University Scholar')
    expect(semestralStanding(1.6, 18, 'regular', false)).toBe('College Scholar')
    expect(semestralStanding(1.9, 18, 'regular', false)).toBe('Honor Roll')
    expect(semestralStanding(1.4, 12, 'regular', false)).toBeNull()
    expect(semestralStanding(1.4, 6, 'midyear', false)).toBe('University Scholar')
    expect(semestralStanding(1.4, 18, 'regular', true)).toBeNull()
  })
})

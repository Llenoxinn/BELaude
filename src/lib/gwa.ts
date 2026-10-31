import {
  classifyCourse,
  isThesisCourse,
  rules as defaultRules,
  thesisKey,
  type CourseInput,
  type HonorTier,
  type Rules,
  type TierId,
} from './rules'

/** UP grades step by 0.25 from 1.00 to 3.00 (passing). */
export const GRADE_STEPS = [1, 1.25, 1.5, 1.75, 2, 2.25, 2.5, 2.75, 3]
export const BEST_GRADE = 1
export const WORST_GRADE = 5

const EPS = 1e-9

// ---------- rounding ----------

/** GWA as UP compares it for honors: rounded (or truncated) to 4 decimals. */
export function officialGwa(gwa: number, r: Rules = defaultRules): number {
  const f = 10 ** r.gwa.decimals
  return r.gwa.rounding === 'truncate' ? Math.floor(gwa * f + EPS) / f : Math.round(gwa * f) / f
}

/**
 * A target shown to the student, rounded toward the better grade so that hitting the
 * shown number always keeps the tier. 1.4167 is shown as 1.41, never 1.42.
 */
export function floorTarget(target: number): number {
  return Math.floor(target * 100 + EPS) / 100
}

// ---------- semester and cumulative GWA ----------

export interface Totals {
  units: number
  points: number
}

export function gwaOf(t: Totals): number | null {
  return t.units > 0 ? t.points / t.units : null
}

export type SemesterInput =
  | { mode: 'gwa'; gwa: number | null; units: number | null }
  | { mode: 'courses'; courses: CourseInput[] }

export interface SemesterTotals extends Totals {
  gwa: number | null
  /** Thesis/SP units with an S grade, waiting for the final grade of the same course. */
  thesisS: { key: string; units: number }[]
  /** Last numeric grade per thesis key, used to resolve S units from other terms. */
  thesisGrades: Record<string, number>
  pendingInc: number
  invalid: number
}

export function semesterTotals(sem: SemesterInput, r: Rules = defaultRules): SemesterTotals {
  const empty: SemesterTotals = { units: 0, points: 0, gwa: null, thesisS: [], thesisGrades: {}, pendingInc: 0, invalid: 0 }
  if (sem.mode === 'gwa') {
    if (sem.gwa === null || sem.units === null || sem.units <= 0) return empty
    return { ...empty, units: sem.units, points: sem.gwa * sem.units, gwa: sem.gwa }
  }
  const out = { ...empty, thesisS: [] as SemesterTotals['thesisS'], thesisGrades: {} as Record<string, number> }
  for (const course of sem.courses) {
    const t = classifyCourse(course, r)
    if (t.kind === 'counted') {
      out.units += t.units
      out.points += t.grade * t.units
      if (isThesisCourse(course.code, r)) out.thesisGrades[thesisKey(course.code)] = t.grade
    } else if (t.kind === 'pending' && t.reason === 'thesis-s') {
      out.thesisS.push({ key: t.thesisKey!, units: t.units! })
    } else if (t.kind === 'pending' && t.reason === 'inc') {
      out.pendingInc += 1
    } else if (t.kind === 'invalid') {
      out.invalid += 1
    }
  }
  out.gwa = gwaOf(out)
  return out
}

export interface Cumulative extends Totals {
  gwa: number | null
  /** S units still waiting for a final thesis grade. */
  unresolvedThesisUnits: number
}

/**
 * Adds up completed semesters. An S in a thesis/SP course counts for its full units at the
 * final grade of the same course (3 units S + 3 units 1.75 = 6 units of 1.75).
 */
export function cumulative(semesters: SemesterTotals[]): Cumulative {
  let units = 0
  let points = 0
  const finalGrades: Record<string, number> = {}
  for (const s of semesters) {
    units += s.units
    points += s.points
    Object.assign(finalGrades, s.thesisGrades)
  }
  let unresolvedThesisUnits = 0
  for (const s of semesters) {
    for (const { key, units: u } of s.thesisS) {
      const g = finalGrades[key]
      if (g === undefined) {
        unresolvedThesisUnits += u
      } else {
        units += u
        points += g * u
      }
    }
  }
  return { units, points, gwa: gwaOf({ units, points }), unresolvedThesisUnits }
}

// ---------- honors math ----------

/** Average grade needed on all remaining units: (thr x T - P) / R. */
export function requiredAverage(threshold: number, totalUnits: number, points: number, remainingUnits: number): number {
  if (remainingUnits <= 0) return NaN
  return (threshold * totalUnits - points) / remainingUnits
}

export type TierStatus =
  | 'locked' // needs worse than 5.00 on average: cannot be lost by GWA alone
  | 'reachable'
  | 'stretch' // needs 1.00 to 1.10
  | 'theoretical' // needs exactly 1.00 on every remaining unit
  | 'out' // needs better than 1.00
  | 'achieved' // no units left, final GWA qualifies
  | 'missed' // no units left, final GWA does not qualify

export function tierStatus(required: number, r: Rules = defaultRules): TierStatus {
  if (required > WORST_GRADE + EPS) return 'locked'
  if (required < BEST_GRADE - 1e-6) return 'out'
  if (Math.abs(required - BEST_GRADE) <= 1e-6) return 'theoretical'
  if (required <= r.stretchMaxRequired + EPS) return 'stretch'
  return 'reachable'
}

export function tierForGwa(gwa: number, r: Rules = defaultRules): HonorTier | null {
  const g = officialGwa(gwa, r)
  return r.latinHonors.find((t) => g <= t.maxGwa + EPS) ?? null
}

export function finalGwa(points: number, units: number, remainingUnits: number, avgOnRemaining: number): number {
  return (points + avgOnRemaining * remainingUnits) / (units + remainingUnits)
}

// ---------- per-semester targets ----------

/**
 * Splits the remaining units across the remaining semesters in proportion to each one’s
 * nominal load, keeping whole units and an exact total (largest remainder).
 */
export function distributeUnits(remaining: number, nominal: number[]): number[] {
  const n = nominal.length
  if (n === 0) return []
  if (remaining <= 0) return nominal.map(() => 0)
  const weights = nominal.map((u) => (u > 0 ? u : 0))
  const weightSum = weights.reduce((a, b) => a + b, 0)
  const shares = weightSum > 0 ? weights.map((w) => (w / weightSum) * remaining) : weights.map(() => remaining / n)
  if (!Number.isInteger(remaining)) return shares
  const floors = shares.map(Math.floor)
  let left = remaining - floors.reduce((a, b) => a + b, 0)
  const order = shares.map((s, i) => ({ i, frac: s - Math.floor(s) })).sort((a, b) => b.frac - a.frac || a.i - b.i)
  for (const { i } of order) {
    if (left <= 0) break
    floors[i] += 1
    left -= 1
  }
  return floors
}

export interface PlanSemester {
  id: string
  units: number
  /** A GWA the student commits to for this semester (flexible budget). */
  planned: number | null
}

export interface SemesterTarget {
  id: string
  units: number
  /** Exact GWA needed this semester, or the planned value when the student set one. */
  target: number
  planned: boolean
}

export interface TargetPlan {
  semesters: SemesterTarget[]
  /** Required average on the semesters without a planned GWA; null when every one is planned. */
  required: number | null
  /** Final GWA if every semester is planned. */
  finalIfPlanned: number | null
}

export function semesterTargets(threshold: number, totalUnits: number, points: number, plan: PlanSemester[]): TargetPlan {
  let needed = threshold * totalUnits - points
  let freeUnits = 0
  let plannedPoints = 0
  let plannedUnits = 0
  for (const s of plan) {
    if (s.planned !== null) {
      needed -= s.planned * s.units
      plannedPoints += s.planned * s.units
      plannedUnits += s.units
    } else {
      freeUnits += s.units
    }
  }
  const required = freeUnits > 0 ? needed / freeUnits : null
  const doneUnits = totalUnits - plannedUnits - freeUnits
  return {
    semesters: plan.map((s) => ({
      id: s.id,
      units: s.units,
      target: s.planned ?? (required ?? NaN),
      planned: s.planned !== null,
    })),
    required,
    finalIfPlanned: freeUnits === 0 && totalUnits > 0 ? (points + plannedPoints) / (doneUnits + plannedUnits) : null,
  }
}

// ---------- grade mix ----------

export type GradeMix =
  | { kind: 'out' }
  | { kind: 'all'; grade: number }
  | { kind: 'mix'; better: number; worse: number; betterShare: number }
  | { kind: 'passing' }

/** Turns a target average into a plain mix of two neighbouring UP grades. */
export function gradeMix(target: number): GradeMix {
  if (target < BEST_GRADE - 1e-6) return { kind: 'out' }
  if (target >= 3 - EPS) return { kind: 'passing' }
  for (let i = 0; i < GRADE_STEPS.length - 1; i++) {
    const better = GRADE_STEPS[i]
    const worse = GRADE_STEPS[i + 1]
    if (Math.abs(target - better) <= 1e-6) return { kind: 'all', grade: better }
    if (target > better && target < worse) {
      return { kind: 'mix', better, worse, betterShare: (worse - target) / (worse - better) }
    }
  }
  return { kind: 'passing' }
}

/**
 * A concrete semester of equal-unit courses whose average meets the target, for showing what a
 * target looks like in real grades. Null when the target is below 1.00.
 */
export function exampleGrades(target: number, courses = 6): number[] | null {
  const mix = gradeMix(target)
  if (mix.kind === 'out') return null
  if (mix.kind === 'passing') return Array(courses).fill(3)
  if (mix.kind === 'all') return Array(courses).fill(mix.grade)
  const better = Math.ceil(mix.betterShare * courses - 1e-9)
  return [...Array(better).fill(mix.better), ...Array(courses - better).fill(mix.worse)]
}

// ---------- scenarios ----------

export type ScenarioId = 'best' | 'optimistic' | 'likely' | 'pessimistic' | 'cliff' | 'worst'

export interface Scenario {
  id: ScenarioId
  label: string
  assumption: string
  /** Average assumed on the remaining units, or null if there is not enough history. */
  average: number | null
  final: number | null
  tier: HonorTier | null
}

export interface ScenarioInput {
  points: number
  units: number
  remaining: number
  /** Completed semesters in order, oldest first. */
  history: Totals[]
  /** Required average for the lowest tier still reachable (the cliff), if any. */
  cliff: { tier: HonorTier; required: number } | null
  worstGrade?: number
}

export function scenarios(input: ScenarioInput, r: Rules = defaultRules): Scenario[] {
  const { points, units, remaining, history, cliff } = input
  const worstGrade = input.worstGrade ?? 3
  const graded = history.filter((h) => h.units > 0)
  const bestSem = graded.length ? Math.min(...graded.map((h) => h.points / h.units)) : null
  const recent = graded.slice(-2)
  const recentAvg = recent.length >= 2 ? gwaOf(sum(recent)) : gwaOf({ units, points })
  const recentLabel = recent.length >= 2 ? 'your last 2 semesters' : 'your GWA so far'

  const make = (id: ScenarioId, label: string, assumption: string, average: number | null): Scenario => {
    const final = average === null ? null : finalGwa(points, units, remaining, average)
    return { id, label, assumption, average, final, tier: final === null ? null : tierForGwa(final, r) }
  }

  const list: Scenario[] = [
    make('best', 'Best case', 'Every remaining grade is 1.00', 1),
    make('optimistic', 'Optimistic', 'Your best semester so far continues', bestSem),
    make('likely', 'Likely', `You keep the pace of ${recentLabel}`, recentAvg),
    make(
      'pessimistic',
      'Pessimistic',
      'Your recent pace slips by 0.25',
      recentAvg === null ? null : Math.min(WORST_GRADE, recentAvg + 0.25),
    ),
  ]
  if (cliff) {
    list.push(make('cliff', `Just enough for ${cliff.tier.short}`, `You average exactly ${floorTarget(cliff.required).toFixed(2)}`, cliff.required))
  }
  list.push(make('worst', 'Worst case', `Every remaining grade is ${worstGrade.toFixed(2)}`, worstGrade))
  return list
}

function sum(list: Totals[]): Totals {
  return list.reduce((a, b) => ({ units: a.units + b.units, points: a.points + b.points }), { units: 0, points: 0 })
}

// ---------- semestral standing ----------

export function semestralStanding(
  gwa: number | null,
  units: number,
  kind: 'regular' | 'midyear',
  hasFailing: boolean,
  r: Rules = defaultRules,
): string | null {
  if (gwa === null || hasFailing) return null
  if (kind === 'regular' && units < r.regularLoadUnits) return null
  const g = officialGwa(gwa, r)
  return r.semestralStanding.tiers.find((t) => g <= t.maxGwa + EPS)?.name ?? null
}

export type { TierId }

import {
  cumulative,
  distributeUnits,
  finalGwa,
  requiredAverage,
  scenarios as buildScenarios,
  semestralStanding,
  semesterTargets,
  semesterTotals,
  tierForGwa,
  tierStatus,
  type Scenario,
  type SemesterTotals,
  type TargetPlan,
  type TierStatus,
} from './gwa'
import { isFailingGrade, rules as defaultRules, type HonorTier, type Rules, type TierId } from './rules'
import { parseNumber, semesterLabel, sortSemesters, totalUnits, type AppState, type Semester } from './state'

export interface TierResult {
  tier: HonorTier
  /** Average needed on all remaining units, NaN when nothing is left. */
  required: number
  status: TierStatus
  plan: TargetPlan
}

export type ResultState = 'top' | 'lower' | 'stretch' | 'locked' | 'none' | 'done'

export interface DoneSemester {
  semester: Semester
  label: string
  totals: SemesterTotals
  standing: string | null
  failing: string[]
}

export interface UpcomingSemester {
  semester: Semester
  label: string
  units: number
  planned: number | null
}

export interface Results {
  errors: string[]
  T: number
  U: number
  P: number
  R: number
  cumulativeGwa: number | null
  done: DoneSemester[]
  upcoming: UpcomingSemester[]
  /** True when the remaining units had to be spread differently from the planned loads. */
  unitsAdjusted: boolean
  tiers: TierResult[]
  state: ResultState
  /** Recommended tier to plan for, and the next safer one. */
  main: TierResult | null
  safety: TierResult | null
  /** In the stretch state, the tier that needs near-perfect grades. */
  stretch: TierResult | null
  /** Tier the roadmap shows: the student’s pick, else the recommendation. */
  focus: TierResult | null
  bestFinal: number | null
  scenarios: Scenario[]
  /** Regular semesters below a regular load: an underload in any semester can cost Latin honors. */
  underload: { done: DoneSemester[]; upcoming: UpcomingSemester[] }
  pendingInc: number
  unresolvedThesisUnits: number
}

const ATTAINABLE: TierStatus[] = ['locked', 'reachable', 'stretch']

function courseInputs(s: Semester) {
  return s.courses.map((c) => ({
    code: c.code,
    units: parseNumber(c.units),
    grade: c.grade,
    expectedGrade: c.expectedGrade,
    countsInGWA: c.countsInGWA,
  }))
}

export function computeResults(app: AppState, r: Rules = defaultRules): Results {
  const errors: string[] = []
  const sorted = sortSemesters(app.semesters)
  // A graduate's record is complete as entered, even when it differs from the study plan's total
  // (other electives, a shift, extra courses): their final GWA is simply everything they took.
  const finished = app.graduated === true && !sorted.some((s) => s.status === 'upcoming')
  const T = totalUnits(app) ?? 0
  if (!T && !finished) errors.push('Enter the total units of your program first.')

  const done: DoneSemester[] = sorted
    .filter((s) => s.status === 'done')
    .map((s) => {
      const totals =
        s.mode === 'gwa'
          ? semesterTotals({ mode: 'gwa', gwa: parseNumber(s.gwa), units: parseNumber(s.units) }, r)
          : semesterTotals({ mode: 'courses', courses: courseInputs(s) }, r)
      const failing =
        s.mode === 'courses'
          ? s.courses.filter((c) => isFailingGrade(c.grade, r)).map((c) => `${c.code || 'A course'} (${c.grade})`)
          : []
      return {
        semester: s,
        label: semesterLabel(s),
        totals,
        standing: semestralStanding(totals.gwa, totals.units, s.term === 3 ? 'midyear' : 'regular', failing.length > 0, r),
        failing,
      }
    })

  const cum = cumulative(done.map((d) => d.totals))
  const U = cum.units
  const P = cum.points
  if (T && U > T + 1e-9 && !finished) errors.push(`You’ve entered ${U} counted units, more than your program’s ${T}. Check your units or the program total.`)
  const R = finished ? 0 : Math.max(0, T - U)

  const upcomingSems = sorted.filter((s) => s.status === 'upcoming')
  const nominal = upcomingSems.map((s) => parseNumber(s.plannedUnits) ?? 0)
  const dist = distributeUnits(R, nominal)
  const unitsAdjusted = dist.some((u, i) => Math.abs(u - nominal[i]) > 1e-9)
  const upcoming: UpcomingSemester[] = upcomingSems.map((s, i) => {
    const planned = parseNumber(s.plannedGwa)
    return {
      semester: s,
      label: semesterLabel(s),
      units: dist[i],
      planned: planned !== null && planned >= 1 && planned <= 5 ? planned : null,
    }
  })
  if (R > 0 && upcoming.length === 0 && T) {
    errors.push(`You have ${round2(R)} units left but no semesters ahead. Add a semester in the Grades step.`)
  }

  const plan = upcoming.map((u) => ({ id: u.semester.id, units: u.units, planned: u.planned }))
  const finalNow = cum.gwa
  const tiers: TierResult[] = r.latinHonors.map((tier) => {
    const required = R > 0 ? requiredAverage(tier.maxGwa, T, P, R) : NaN
    let status: TierStatus
    if (R > 0) status = tierStatus(required, r)
    else status = finalNow !== null && tierForGwa(finalNow, r) && tierForGwa(finalNow, r)!.maxGwa <= tier.maxGwa ? 'achieved' : 'missed'
    return { tier, required, status, plan: semesterTargets(tier.maxGwa, T, P, plan) }
  })

  // Pick the headline state (plan.md 4b).
  let state: ResultState
  let main: TierResult | null = null
  let safety: TierResult | null = null
  let stretch: TierResult | null = null
  const candidates = tiers.filter((t) => ATTAINABLE.includes(t.status))
  if ((R <= 0 && T) || finished) {
    state = 'done'
    main = tiers.find((t) => t.status === 'achieved') ?? null
  } else if (candidates.length === 0) {
    state = 'none'
  } else {
    const top = candidates[0]
    const below = candidates.slice(1).find((t) => t.status !== 'stretch') ?? null
    if (top.status === 'stretch') {
      state = 'stretch'
      stretch = top
      main = below ?? top
      safety = below ? (candidates[candidates.indexOf(below) + 1] ?? null) : null
    } else {
      main = top
      safety = candidates[1] ?? null
      // "X is out of reach" leads only when a tier students commonly aim for (not summa) has slipped away.
      const above = tiers[tiers.indexOf(top) - 1]
      const lostCommonTier = above && above.status === 'out' && tiers.indexOf(above) > 0
      state = top.status === 'locked' ? 'locked' : lostCommonTier ? 'lower' : 'top'
    }
  }

  const picked = tiers.find((t) => t.tier.id === app.focusTier && t.status !== 'out')
  const focus = picked ?? main ?? candidates[0] ?? null

  const cliffTier = [...candidates].reverse().find((t) => t.status === 'reachable' || t.status === 'stretch') ?? null
  const scenarioList =
    R > 0 && T
      ? buildScenarios(
          {
            points: P,
            units: U,
            remaining: R,
            history: done.map((d) => d.totals).filter((t) => t.units > 0),
            cliff: cliffTier ? { tier: cliffTier.tier, required: cliffTier.required } : null,
          },
          r,
        )
      : []

  const pendingInc = done.reduce((a, d) => a + d.totals.pendingInc, 0)
  return {
    errors,
    T,
    U,
    P,
    R,
    cumulativeGwa: cum.gwa,
    done,
    upcoming,
    unitsAdjusted,
    tiers,
    state,
    main,
    safety,
    stretch,
    focus,
    bestFinal: R > 0 && T ? finalGwa(P, U, R, 1) : cum.gwa,
    scenarios: scenarioList,
    underload: {
      done: done.filter((d) => d.semester.term !== 3 && d.totals.units > 0 && d.totals.units < r.regularLoadUnits),
      upcoming: upcoming.filter((u) => u.semester.term !== 3 && u.units > 0 && u.units < r.regularLoadUnits),
    },
    pendingInc,
    unresolvedThesisUnits: cum.unresolvedThesisUnits,
  }
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

export type { TierId }

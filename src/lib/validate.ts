import { classifyCourse } from './rules'
import { parseNumber, totalUnits, type AppState, type Semester } from './state'

export function programErrors(state: AppState): { totalUnits?: string; semesters?: string } {
  const errors: { totalUnits?: string; semesters?: string } = {}
  if (totalUnits(state) === null) errors.totalUnits = 'Enter the total units counted in your GWA (a number above 0).'
  const sems = parseNumber(state.custom.semesters)
  if (!state.programId && (sems === null || sems < 1 || sems > 20 || !Number.isInteger(sems))) {
    errors.semesters = 'Enter how many regular semesters your program has (1 to 20).'
  }
  return errors
}

export function batchError(state: AppState, now = new Date()): string | null {
  const year = parseNumber(state.batchYear)
  if (year === null || !Number.isInteger(year) || year < 1950 || year > now.getFullYear() + 1) {
    return `Enter the year you entered UP, for example ${now.getFullYear() - 2}.`
  }
  return null
}

export interface SemesterIssues {
  gwa?: string
  units?: string
  general?: string
  courses?: Record<string, string>
}

export function semesterIssues(s: Semester): SemesterIssues | null {
  const issues: SemesterIssues = {}
  if (s.status === 'upcoming') {
    const u = parseNumber(s.plannedUnits)
    if (s.plannedUnits.trim() !== '' && (u === null || u < 0 || u > 40)) issues.units = 'Units must be between 0 and 40.'
  } else if (s.mode === 'gwa') {
    const g = parseNumber(s.gwa)
    const u = parseNumber(s.units)
    if (g === null) issues.gwa = 'Enter your semester GWA, or mark this semester as not done yet.'
    else if (g < 1 || g > 5) issues.gwa = 'A GWA is between 1.00 and 5.00.'
    if (u === null) issues.units = 'Enter the units counted in your GWA.'
    else if (u <= 0 || u > 40) issues.units = 'Units must be more than 0 (and at most 40).'
  } else {
    const courses: Record<string, string> = {}
    let graded = 0
    for (const c of s.courses) {
      if (!c.grade) continue
      graded += 1
      const t = classifyCourse({ code: c.code, units: parseNumber(c.units), grade: c.grade, expectedGrade: c.expectedGrade, countsInGWA: c.countsInGWA })
      if (t.kind === 'invalid') courses[c.id] = t.message
    }
    if (Object.keys(courses).length) issues.courses = courses
    if (graded === 0) issues.general = 'Add a grade for at least one course, or switch to entering your GWA.'
  }
  return Object.keys(issues).length ? issues : null
}

export function gradesIssues(state: AppState): Record<string, SemesterIssues> {
  const out: Record<string, SemesterIssues> = {}
  for (const s of state.semesters) {
    const issues = semesterIssues(s)
    if (issues) out[s.id] = issues
  }
  return out
}

/** The furthest step the student can open from the stepper. */
export function maxStep(state: AppState): number {
  if (Object.keys(programErrors(state)).length) return 0
  if (batchError(state) || state.semesters.length === 0) return 1
  if (Object.keys(gradesIssues(state)).length) return 2
  return 3
}

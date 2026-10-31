import rulesJson from '@/data/rules.json'

export type TierId = 'summa' | 'magna' | 'cum'

export interface HonorTier {
  id: TierId
  name: string
  short: string
  maxGwa: number
}

export interface Rules {
  thresholdsCheckedOn: string
  registrarVerifiedOn: string | null
  sources: { label: string; url: string }[]
  gwa: { decimals: number; rounding: 'round' | 'truncate' }
  latinHonors: HonorTier[]
  stretchMaxRequired: number
  /** Below this many units a regular semester is an underload, which can cost Latin honors. */
  regularLoadUnits: number
  semestralStanding: {
    verified: boolean
    tiers: { id: string; name: string; maxGwa: number }[]
  }
  excluded: {
    coursePatterns: { pattern: string; label: string }[]
    courseNumbers: number[]
    qualitativeGrades: string[]
    verified: boolean
  }
  thesisCourseNumbers: number[]
  /** Used for semester awards only: in UP generally, a 4.00 or 5.00 does not rule out Latin honors. */
  failingGrades: string[]
}

export const rules = rulesJson as Rules

export const NUMERIC_GRADES = ['1.00', '1.25', '1.50', '1.75', '2.00', '2.25', '2.50', '2.75', '3.00', '4.00', '5.00']
export const SPECIAL_GRADES = ['INC', 'DRP', 'P', 'F', 'S', 'U']
export const ALL_GRADES = [...NUMERIC_GRADES, ...SPECIAL_GRADES]

export interface CourseInput {
  code: string
  units: number | null
  grade: string
  /** Expected grade for an INC, so it can count before it is completed. */
  expectedGrade?: string
  /** From prospectus data; false for NSTP and PE. Overrides the code patterns when set. */
  countsInGWA?: boolean
}

export type CourseTreatment =
  | { kind: 'counted'; grade: number; units: number; viaExpected: boolean }
  | { kind: 'excluded'; label: string }
  | { kind: 'pending'; reason: 'inc' | 'thesis-s' | 'blank'; thesisKey?: string; units?: number }
  | { kind: 'invalid'; message: string }

export function courseNumber(code: string): number | null {
  const match = code.match(/(\d{2,3})/)
  return match ? Number(match[1]) : null
}

/** "cmsc 190-2" and "CMSC 190" share a key, so an S in one term can take the grade given in another. */
export function thesisKey(code: string): string {
  const match = code.toUpperCase().match(/^([A-Z .]*?)\s*(\d{2,3})/)
  return match ? `${match[1].replace(/[\s.]/g, '')} ${match[2]}` : code.toUpperCase().trim()
}

/** Why a course code is left out of the GWA, or null if it counts. */
export function excludedByCode(code: string, r: Rules = rules): string | null {
  const normalized = code.trim().toUpperCase()
  if (!normalized) return null
  for (const { pattern, label } of r.excluded.coursePatterns) {
    if (new RegExp(pattern, 'i').test(normalized)) return label
  }
  const num = courseNumber(normalized)
  if (num !== null && r.excluded.courseNumbers.includes(num)) return `${num} course`
  return null
}

export function isThesisCourse(code: string, r: Rules = rules): boolean {
  const num = courseNumber(code)
  return num !== null && r.thesisCourseNumbers.includes(num)
}

export function classifyCourse(course: CourseInput, r: Rules = rules): CourseTreatment {
  const grade = course.grade.trim().toUpperCase()
  const units = course.units

  const byCode = excludedByCode(course.code, r)
  if (course.countsInGWA === false) return { kind: 'excluded', label: byCode ?? 'Not counted' }
  if (byCode && course.countsInGWA !== true) return { kind: 'excluded', label: byCode }

  if (!grade) return { kind: 'pending', reason: 'blank' }
  if (grade === 'DRP') return { kind: 'excluded', label: 'Dropped' }

  if (units === null || !Number.isFinite(units)) return { kind: 'invalid', message: 'Enter the units' }
  if (units <= 0) return { kind: 'invalid', message: 'Units must be more than 0' }

  if (grade === 'INC') {
    const expected = course.expectedGrade?.trim()
    if (expected && NUMERIC_GRADES.includes(expected)) {
      return { kind: 'counted', grade: Number(expected), units, viaExpected: true }
    }
    return { kind: 'pending', reason: 'inc' }
  }

  if (grade === 'S' && isThesisCourse(course.code, r)) {
    return { kind: 'pending', reason: 'thesis-s', thesisKey: thesisKey(course.code), units }
  }

  if (r.excluded.qualitativeGrades.includes(grade)) return { kind: 'excluded', label: `Grade ${grade}` }

  if (!NUMERIC_GRADES.includes(grade)) return { kind: 'invalid', message: 'Pick a grade from the list' }
  return { kind: 'counted', grade: Number(grade), units, viaExpected: false }
}

export function isFailingGrade(grade: string, r: Rules = rules): boolean {
  return r.failingGrades.includes(grade.trim().toUpperCase())
}

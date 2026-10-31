import { excludedByCode } from './rules'

export interface ProgramCourse {
  code: string
  title?: string
  units: number
  countsInGWA?: boolean
}

export interface ProgramSemester {
  label: string
  kind: 'regular' | 'midyear'
  /** Credit units as the study plan prints them (NSTP and PE already left out). */
  units: number
  /** Optional. Only courses that matter to the GWA need listing, such as a 199 course. */
  courses?: ProgramCourse[]
}

export interface Program {
  id: string
  name: string
  college?: string
  curriculum?: string
  /** Sum of the semester units. */
  totalUnits: number
  /** Set when the study plan prints a total that differs from its semesters. */
  statedTotalUnits?: number
  note?: string
  source: string
  retrievedOn: string
  verifiedBy?: string
  semesters: ProgramSemester[]
}

export interface CampusFile {
  campus: string
  campusId: string
  programs: Program[]
}

const files = import.meta.glob<CampusFile>('../data/programs/*.json', { eager: true, import: 'default' })

/** Campus files in data/programs. Files starting with "_" are templates and are skipped. */
export const campuses: CampusFile[] = Object.entries(files)
  .filter(([path]) => !path.split('/').pop()!.startsWith('_'))
  .map(([, file]) => file)

export function findProgram(campusId: string, programId: string): Program | null {
  return campuses.find((c) => c.campusId === campusId)?.programs.find((p) => p.id === programId) ?? null
}

/** Listed courses that rules.json leaves out of the GWA (for example a 199 course). */
export function notCounted(sem: ProgramSemester): ProgramCourse[] {
  return (sem.courses ?? []).filter((c) => c.countsInGWA === false || (c.countsInGWA !== true && excludedByCode(c.code) !== null))
}

export function semesterGwaUnits(sem: ProgramSemester): number {
  return sem.units - notCounted(sem).reduce((a, c) => a + c.units, 0)
}

/** Total units counted in the GWA (T). */
export function programGwaUnits(program: Program): number {
  return program.semesters.reduce((a, s) => a + semesterGwaUnits(s), 0)
}

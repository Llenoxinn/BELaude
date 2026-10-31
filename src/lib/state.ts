import { findProgram, programGwaUnits, semesterGwaUnits, type Program } from './programs'
import type { TierId } from './rules'

export type Term = 1 | 2 | 3 // 3 = midyear

export interface Course {
  id: string
  code: string
  title: string
  units: string
  grade: string
  expectedGrade: string
  /** Set from prospectus data. */
  countsInGWA?: boolean
}

export interface Semester {
  id: string
  ay: number
  term: Term
  /** Prospectus label such as "2nd year, 1st sem". */
  yearLabel: string
  status: 'done' | 'upcoming'
  mode: 'gwa' | 'courses'
  /** Option A: the semester GWA and its GWA-counted units. */
  gwa: string
  units: string
  courses: Course[]
  /** For upcoming semesters: expected GWA-counted units, and an optional planned GWA (what-if). */
  plannedUnits: string
  plannedGwa: string
  /** Added by the student (extra year, midyear), so it is kept when the list is rebuilt. */
  extra?: boolean
}

export interface AppState {
  version: 1
  step: number
  campusId: string
  programId: string
  custom: { totalUnits: string; semesters: string }
  batchYear: string
  semesters: Semester[]
  focusTier: TierId | ''
}

export const OTHER_CAMPUS = 'other'
export const STORAGE_KEY = 'belaude:v1'

export const initialState: AppState = {
  version: 1,
  step: 0,
  campusId: 'upc',
  programId: '',
  custom: { totalUnits: '', semesters: '8' },
  batchYear: '',
  semesters: [],
  focusTier: '',
}

let idCounter = 0
export function newId(prefix = 'id'): string {
  idCounter += 1
  return `${prefix}-${Date.now().toString(36)}-${idCounter}-${Math.random().toString(36).slice(2, 6)}`
}

// ---------- terms ----------

export function termKey(ay: number, term: Term): number {
  return ay * 10 + term
}

/** The term in progress on a date: Aug to Dec is 1st sem, Jan to May 2nd sem, Jun and Jul midyear. */
export function currentTerm(now: Date): { ay: number; term: Term } {
  const m = now.getMonth()
  const y = now.getFullYear()
  if (m >= 7) return { ay: y, term: 1 }
  if (m <= 4) return { ay: y - 1, term: 2 }
  return { ay: y - 1, term: 3 }
}

export function termName(term: Term): string {
  return term === 1 ? '1st sem' : term === 2 ? '2nd sem' : 'Midyear'
}

export function ayLabel(ay: number): string {
  return `AY ${ay}–${String((ay + 1) % 100).padStart(2, '0')}`
}

export function semesterLabel(s: Pick<Semester, 'ay' | 'term'>): string {
  return `${termName(s.term)}, ${ayLabel(s.ay)}`
}

export function sortSemesters(list: Semester[]): Semester[] {
  return [...list].sort((a, b) => termKey(a.ay, a.term) - termKey(b.ay, b.term))
}

// ---------- program ----------

export function activeProgram(state: AppState): Program | null {
  return state.campusId === OTHER_CAMPUS || !state.programId ? null : findProgram(state.campusId, state.programId)
}

export function parseNumber(value: string): number | null {
  if (value.trim() === '') return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

/** Total GWA-counted units of the degree (T). */
export function totalUnits(state: AppState): number | null {
  const program = activeProgram(state)
  if (program) return programGwaUnits(program)
  const t = parseNumber(state.custom.totalUnits)
  return t !== null && t > 0 ? t : null
}

interface Slot {
  ay: number
  term: Term
  yearLabel: string
  nominalUnits: number | null
}

function programSlots(state: AppState, batch: number): Slot[] {
  const program = activeProgram(state)
  if (program) {
    const slots: Slot[] = []
    let ay = batch
    let nextRegular: 1 | 2 = 1
    for (const sem of program.semesters) {
      let term: Term
      if (sem.kind === 'midyear') {
        term = 3
      } else {
        term = nextRegular
        nextRegular = nextRegular === 1 ? 2 : 1
      }
      slots.push({
        ay,
        term,
        yearLabel: sem.label,
        nominalUnits: semesterGwaUnits(sem),
      })
      if (term === 3 || (term === 2 && program.semesters[slots.length]?.kind !== 'midyear')) ay += 1
    }
    return slots
  }
  const count = Math.max(1, Math.min(20, Math.round(parseNumber(state.custom.semesters) ?? 8)))
  const t = totalUnits(state)
  const even = t ? Math.round((t / count) * 100) / 100 : null
  return Array.from({ length: count }, (_, i) => ({
    ay: batch + Math.floor(i / 2),
    term: (i % 2 === 0 ? 1 : 2) as Term,
    yearLabel: `${ordinal(Math.floor(i / 2) + 1)} year, ${termName((i % 2 === 0 ? 1 : 2) as Term)}`,
    nominalUnits: even,
  }))
}

function ordinal(n: number): string {
  const s = ['th', 'st', 'nd', 'rd']
  const v = n % 100
  return n + (s[(v - 20) % 10] || s[v] || s[0])
}

export function blankSemester(ay: number, term: Term, now: Date, extra: Partial<Semester> = {}): Semester {
  const cur = currentTerm(now)
  return {
    id: newId('s'),
    ay,
    term,
    yearLabel: '',
    status: termKey(ay, term) < termKey(cur.ay, cur.term) ? 'done' : 'upcoming',
    mode: 'gwa',
    gwa: '',
    units: '',
    courses: [],
    plannedUnits: '',
    plannedGwa: '',
    ...extra,
  }
}

function hasData(s: Semester): boolean {
  return s.gwa !== '' || s.courses.some((c) => c.grade !== '') || s.plannedGwa !== ''
}

/**
 * Builds the semester list from the program and batch year. Semesters the student already
 * filled in are kept (matched by term), as are extra ones they added themselves.
 */
export function buildSemesters(state: AppState, now = new Date()): Semester[] {
  const batch = parseNumber(state.batchYear)
  if (batch === null) return state.semesters
  const existing = new Map(state.semesters.map((s) => [termKey(s.ay, s.term), s]))
  const used = new Set<number>()
  const built = programSlots(state, batch).map((slot) => {
    const key = termKey(slot.ay, slot.term)
    const prev = existing.get(key)
    const units = slot.nominalUnits !== null ? String(slot.nominalUnits) : ''
    if (prev) {
      used.add(key)
      return { ...prev, yearLabel: slot.yearLabel, plannedUnits: prev.plannedUnits || units, units: prev.units || units }
    }
    // Semester GWA and units are the default; entering each course is optional.
    return blankSemester(slot.ay, slot.term, now, { yearLabel: slot.yearLabel, plannedUnits: units, units })
  })
  const kept = state.semesters.filter((s) => !used.has(termKey(s.ay, s.term)) && (hasData(s) || s.extra))
  return sortSemesters([...built, ...kept])
}

/** Next free term after the last semester, for "add a semester". */
export function nextTerm(list: Semester[], midyear: boolean): { ay: number; term: Term } {
  const sorted = sortSemesters(list)
  const last = sorted[sorted.length - 1]
  if (!last) return { ay: new Date().getFullYear(), term: 1 }
  const taken = new Set(list.map((s) => termKey(s.ay, s.term)))
  if (midyear) {
    for (let ay = sorted[0].ay; ay <= last.ay + 1; ay++) {
      if (!taken.has(termKey(ay, 3))) return { ay, term: 3 }
    }
  }
  if (last.term === 1) return { ay: last.ay, term: 2 }
  return { ay: last.ay + 1, term: 1 }
}

// ---------- persistence ----------

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? parseImport(raw) : null
  } catch {
    return null
  }
}

export function saveState(state: AppState): boolean {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch {
    return false
  }
}

export function clearState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    // storage blocked; nothing to clear
  }
}

/** Validates an exported JSON file. Throws with a readable message when it isn’t one. */
export function parseImport(text: string): AppState {
  const data = JSON.parse(text) as Partial<AppState>
  if (!data || data.version !== 1 || !Array.isArray(data.semesters)) {
    throw new Error('This file is not a BELaude backup.')
  }
  return {
    ...initialState,
    ...data,
    custom: { ...initialState.custom, ...data.custom },
    semesters: data.semesters.map((s) => ({
      ...blankSemester(s.ay, s.term, new Date()),
      ...s,
      courses: (s.courses ?? []).map((c) => ({ ...c, expectedGrade: c.expectedGrade ?? '' })),
    })),
  }
}

export function exportFileName(): string {
  return `belaude-backup-${new Date().toISOString().slice(0, 10)}.json`
}

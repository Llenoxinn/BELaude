import { describe, expect, it } from 'vitest'
import type { CampusFile } from '@/lib/programs'
import { programGwaUnits } from '@/lib/programs'

const files = import.meta.glob<CampusFile>('../src/data/programs/*.json', { eager: true, import: 'default' })

// Guards hand-entered study plan data: semester units must add up to the program total.
describe.each(Object.entries(files))('%s', (_path, file) => {
  it('has a programs list', () => {
    expect(Array.isArray(file.programs)).toBe(true)
  })

  it.each(file.programs.map((p) => [p.id, p] as const))('%s adds up', (_id, p) => {
    expect(p.semesters.reduce((a, s) => a + s.units, 0)).toBe(p.totalUnits)
    expect(p.semesters.every((s) => s.units > 0)).toBe(true)
    expect(programGwaUnits(p)).toBeLessThanOrEqual(p.totalUnits)
    expect(p.source).toMatch(/^https?:\/\//)
    expect(p.retrievedOn).toMatch(/^\d{4}-\d{2}-\d{2}$|^YYYY-MM-DD$/)
  })

  it('has unique program ids', () => {
    const ids = file.programs.map((p) => p.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('UP Cebu programs', () => {
  const upc = Object.entries(files).find(([path]) => path.endsWith('ucebu.json'))![1]

  it('matches the printed study plan totals', () => {
    const totals = Object.fromEntries(upc.programs.map((p) => [p.id, p.totalUnits]))
    expect(totals).toEqual({
      'bs-biology': 143,
      'ba-communication': 144,
      'bs-computer-science': 155,
      'bfa-product-design': 147,
      'bfa-studio-arts': 147,
      'bs-management-finance': 148,
      'bs-management-marketing': 148,
      'bs-mathematics': 150,
      'ba-political-science': 144,
      'ba-psychology': 142,
      'bs-statistics': 140,
    })
  })

  it('leaves 199 courses out of the GWA units', () => {
    const polsci = upc.programs.find((p) => p.id === 'ba-political-science')!
    expect(programGwaUnits(polsci)).toBe(138)
    const cs = upc.programs.find((p) => p.id === 'bs-computer-science')!
    expect(programGwaUnits(cs)).toBe(155)
  })
})

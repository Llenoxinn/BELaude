import { fmt } from './copy'
import type { Results } from './results'

const W = 1200
const H = 630
const C = {
  maroon: '#8B1335',
  green: '#00573F',
  gold: '#F5B21A',
  black: '#111111',
  muted: '#6B6A66',
  hairline: '#EAEAEA',
}
const FONTS = {
  sans: '"Geist Variable", "Helvetica Neue", sans-serif',
  pixel: '"Departure Mono", ui-monospace, monospace', // logo only
}

export function canShare(res: Results): boolean {
  return !!res.focus && res.R > 0 && res.upcoming.length > 0 && ['reachable', 'stretch', 'locked'].includes(res.focus.status)
}

/**
 * The "Laude Roadmap" card (design.md 5.5): 1200 x 630. The goal and the target, large in maroon,
 * on the left; the semesters ahead on a tinted panel on the right. No name and no grades.
 */
export async function renderShareCard(res: Results): Promise<Blob | null> {
  const focus = res.focus
  if (!focus || !canShare(res)) return null
  await Promise.all(
    ['600 60px', '600 140px'].map((s) => document.fonts.load(`${s} ${FONTS.sans}`)).concat([
      document.fonts.load(`30px ${FONTS.sans}`),
      document.fonts.load(`600 24px ${FONTS.sans}`),
      document.fonts.load(`20px ${FONTS.pixel}`),
    ]),
  ).catch(() => undefined)

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  // Two zones: the goal on the left, the semester list on a tinted panel on the right
  const PANEL = 700
  const L = 72
  const LW = PANEL - L - 56 // usable width on the left
  const R0 = PANEL + 48
  const R1 = W - 72

  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, W, H)
  ctx.fillStyle = '#FAF9F7'
  ctx.fillRect(PANEL, 0, W - PANEL, H)
  ctx.strokeStyle = C.hairline
  ctx.lineWidth = 2
  ctx.strokeRect(1, 1, W - 2, H - 2)
  ctx.textBaseline = 'alphabetic'

  /** Sets the font at `size`, shrinking it until `text` fits in `max` pixels. */
  const fit = (text: string, weight: string, size: number, family: string, max: number) => {
    let px = size
    do ctx.font = `${weight} ${px}px ${family}`.trim()
    while (ctx.measureText(text).width > max && --px > 12)
  }

  const required = focus.plan.required ?? focus.required
  const locked = focus.status === 'locked' || required > 5
  const n = res.upcoming.length

  // Wordmark as the card's header
  const lines = [
    { text: 'BE LOUD', bg: C.maroon, fg: '#FFFFFF' },
    { text: 'BE A', bg: C.green, fg: '#FFFFFF' },
    { text: 'LAUDE', bg: C.gold, fg: C.black },
  ]
  ctx.font = `20px ${FONTS.pixel}`
  lines.forEach((l, i) => {
    const y = 56 + i * 34
    ctx.fillStyle = l.bg
    ctx.fillRect(L, y, ctx.measureText(l.text).width + 20, 30)
    ctx.fillStyle = l.fg
    ctx.fillText(l.text, L + 10, y + 22)
  })

  // The goal
  const title = `My path to ${focus.tier.short}`
  fit(title, '600', 60, FONTS.sans, LW)
  ctx.fillStyle = C.black
  ctx.fillText(title, L, 246)

  ctx.fillStyle = C.muted
  ctx.font = `600 22px ${FONTS.sans}`
  ctx.fillText(locked ? 'Secured by the numbers' : 'Semester GWA to aim for', L, 296)

  const big = locked ? 'Secured' : fmt.target(required)
  fit(big, '600', 140, FONTS.sans, LW - 170)
  ctx.fillStyle = C.maroon
  ctx.fillText(big, L - 4, 430)
  if (!locked) {
    const w = ctx.measureText(big).width
    ctx.fillStyle = C.muted
    ctx.font = `32px ${FONTS.sans}`
    ctx.fillText('or better', L + w + 16, 430)
  }

  const sub = locked ? `My final GWA stays ${focus.tier.maxGwa.toFixed(2)} or better.` : `In each of my next ${n} semester${n === 1 ? '' : 's'}.`
  fit(sub, '', 28, FONTS.sans, LW)
  ctx.fillStyle = C.black
  ctx.fillText(sub, L, 484)

  const stretch = focus.status === 'stretch'
  ctx.fillStyle = stretch ? C.gold : C.green
  ctx.beginPath()
  ctx.arc(L + 8, 550, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = C.black
  ctx.font = `600 22px ${FONTS.sans}`
  const statusText = stretch ? 'Stretch' : 'On track'
  ctx.fillText(statusText, L + 26, 558)
  if (!locked) {
    ctx.fillStyle = C.muted
    ctx.font = `22px ${FONTS.sans}`
    ctx.fillText(`Final GWA goal ${focus.tier.maxGwa.toFixed(2)}`, L + 26 + ctx.measureText(statusText).width + 40, 558)
  }

  // The semesters, on the panel
  const rows = res.upcoming.slice(0, 6)
  ctx.font = `600 20px ${FONTS.sans}`
  ctx.fillStyle = C.muted
  ctx.fillText('Semester', R0, 96)
  ctx.textAlign = 'right'
  ctx.fillText('Aim for', R1, 96)
  ctx.textAlign = 'left'
  rows.forEach((u, i) => {
    const y = 116 + i * 60
    ctx.strokeStyle = C.hairline
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(R0, y)
    ctx.lineTo(R1, y)
    ctx.stroke()
    ctx.fillStyle = C.black
    fit(u.label, '', 23, FONTS.sans, R1 - R0 - 110)
    ctx.fillText(u.label, R0, y + 39)
    const t = focus.plan.semesters[i]?.target
    ctx.textAlign = 'right'
    ctx.fillStyle = C.maroon
    ctx.font = `600 27px ${FONTS.sans}`
    ctx.fillText(t === undefined || !Number.isFinite(t) ? '' : t > 5 ? 'Any' : fmt.target(t), R1, y + 39)
    ctx.textAlign = 'left'
  })
  if (res.upcoming.length > rows.length) {
    ctx.fillStyle = C.muted
    ctx.font = `20px ${FONTS.sans}`
    ctx.fillText(`and ${res.upcoming.length - rows.length} more`, R0, 116 + rows.length * 60 + 34)
  }

  const note = 'Unofficial. Final honors are determined by UP.'
  fit(note, '', 17, FONTS.sans, R1 - R0)
  ctx.fillStyle = C.muted
  ctx.fillText(note, R0, H - 48)

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

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
  serif: '"Newsreader Variable", Georgia, serif',
  sans: '"Geist Variable", "Helvetica Neue", sans-serif',
  pixel: '"Departure Mono", ui-monospace, monospace', // logo only
}

export function canShare(res: Results): boolean {
  return !!res.focus && res.R > 0 && res.upcoming.length > 0 && ['reachable', 'stretch', 'locked'].includes(res.focus.status)
}

/**
 * The "Laude Roadmap" card (design.md 5.5): 1200 x 630, white, the target large in maroon, a mini
 * roadmap and the wordmark. No name and no grades.
 */
export async function renderShareCard(res: Results): Promise<Blob | null> {
  const focus = res.focus
  if (!focus || !canShare(res)) return null
  await Promise.all(
    ['500 68px', '500 150px'].map((s) => document.fonts.load(`${s} ${FONTS.serif}`)).concat([
      document.fonts.load(`30px ${FONTS.sans}`),
      document.fonts.load(`600 24px ${FONTS.sans}`),
      document.fonts.load(`22px ${FONTS.pixel}`),
    ]),
  ).catch(() => undefined)

  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.fillStyle = '#FFFFFF'
  ctx.fillRect(0, 0, W, H)
  ctx.strokeStyle = C.hairline
  ctx.lineWidth = 2
  ctx.strokeRect(1, 1, W - 2, H - 2)
  ctx.textBaseline = 'alphabetic'

  const required = focus.plan.required ?? focus.required
  const locked = focus.status === 'locked' || required > 5

  ctx.fillStyle = C.muted
  ctx.font = `600 22px ${FONTS.sans}`
  ctx.fillText('Laude Roadmap', 72, 96)

  ctx.fillStyle = C.black
  ctx.font = `500 68px ${FONTS.serif}`
  ctx.fillText(`My path to ${focus.tier.short}`, 72, 172)
  ctx.fillStyle = C.muted
  ctx.font = `600 22px ${FONTS.sans}`
  ctx.fillText(locked ? 'Secured by the numbers' : 'Semester GWA to aim for', 72, 222)

  ctx.fillStyle = C.maroon
  ctx.font = `500 150px ${FONTS.serif}`
  const big = locked ? 'Secured' : fmt.target(required)
  ctx.fillText(big, 66, 338)
  if (!locked) {
    const w = ctx.measureText(big).width
    ctx.fillStyle = C.muted
    ctx.font = `34px ${FONTS.sans}`
    ctx.fillText('or better', 66 + w + 20, 338)
  }

  const n = res.upcoming.length
  ctx.fillStyle = C.muted
  ctx.font = `30px ${FONTS.sans}`
  ctx.fillText(
    locked ? `final GWA stays ${focus.tier.maxGwa.toFixed(2)} or better` : `each of the next ${n} semester${n === 1 ? '' : 's'} · final GWA goal ${focus.tier.maxGwa.toFixed(2)}`,
    72,
    396,
  )

  const stretch = focus.status === 'stretch'
  ctx.fillStyle = stretch ? C.gold : C.green
  ctx.beginPath()
  ctx.arc(81, 446, 8, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = C.black
  ctx.font = `600 22px ${FONTS.sans}`
  ctx.fillText(stretch ? 'Stretch' : 'On track', 100, 454)

  // Mini roadmap
  const rows = res.upcoming.slice(0, 5)
  const x0 = 720
  const x1 = W - 72
  ctx.font = `600 20px ${FONTS.sans}`
  ctx.fillStyle = C.muted
  ctx.fillText('Semester', x0, 140)
  ctx.textAlign = 'right'
  ctx.fillText('Aim for', x1, 140)
  ctx.textAlign = 'left'
  rows.forEach((u, i) => {
    const y = 160 + i * 64
    ctx.strokeStyle = C.hairline
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(x0, y)
    ctx.lineTo(x1, y)
    ctx.stroke()
    ctx.fillStyle = C.black
    ctx.font = `24px ${FONTS.sans}`
    ctx.fillText(u.label.replace(', AY ', ' · '), x0, y + 42)
    const t = focus.plan.semesters[i]?.target
    ctx.textAlign = 'right'
    ctx.fillStyle = C.maroon
    ctx.font = `600 28px ${FONTS.sans}`
    ctx.fillText(t === undefined || !Number.isFinite(t) ? '' : t > 5 ? 'any' : fmt.target(t), x1, y + 42)
    ctx.textAlign = 'left'
  })
  if (res.upcoming.length > rows.length) {
    ctx.fillStyle = C.muted
    ctx.font = `20px ${FONTS.sans}`
    ctx.fillText(`+ ${res.upcoming.length - rows.length} more`, x0, 160 + rows.length * 64 + 36)
  }

  // Wordmark, bottom left
  const lines = [
    { text: 'BE LOUD', bg: C.maroon, fg: '#FFFFFF', border: false },
    { text: 'BE A', bg: C.green, fg: '#FFFFFF', border: false },
    { text: 'LAUDE', bg: '#FFFFFF', fg: C.black, border: true },
  ]
  ctx.font = `22px ${FONTS.pixel}`
  lines.forEach((l, i) => {
    const y = 488 + i * 38
    const w = ctx.measureText(l.text).width + 24
    ctx.fillStyle = l.bg
    ctx.fillRect(72, y, w, 34)
    if (l.border) {
      ctx.strokeStyle = C.black
      ctx.lineWidth = 2
      ctx.strokeRect(73, y + 1, w - 2, 32)
    }
    ctx.fillStyle = l.fg
    ctx.fillText(l.text, 84, y + 25)
  })

  ctx.fillStyle = C.muted
  ctx.font = `18px ${FONTS.sans}`
  ctx.textAlign = 'right'
  ctx.fillText('Unofficial. Final honors are determined by UP.', x1, H - 56)

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}

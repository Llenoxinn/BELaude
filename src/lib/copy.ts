import { floorTarget, gradeMix, officialGwa, WORST_GRADE } from './gwa'
import type { Results, TierResult } from './results'

export const fmt = {
  /** A target, rounded toward the better grade: 1.4167 becomes "1.41". */
  target: (n: number) => floorTarget(n).toFixed(2),
  /** A computed GWA at the 4 decimals UP compares. */
  gwa: (n: number) => officialGwa(n).toFixed(4),
  grade: (n: number) => n.toFixed(2),
  units: (n: number) => (Number.isInteger(n) ? String(n) : n.toFixed(2)),
}

export type Tone = 'maroon' | 'green' | 'gold' | 'neutral'

export interface StatusCopy {
  headline: string
  body: string
  badge: { label: string; tone: Tone }
}

/** The four result states from plan.md 4b, plus "locked" and "done". Never claims what the math doesn’t support. */
export function statusCopy(res: Results): StatusCopy {
  const { main, stretch, state } = res
  switch (state) {
    case 'top':
      return {
        headline: `${main!.tier.short} is still in your hands.`,
        body: `Get a semester GWA of ${fmt.target(main!.required)} or better in each semester you have left.${pace(res, main!)}`,
        badge: { label: 'On track', tone: 'green' },
      }
    case 'lower': {
      const above = res.tiers[res.tiers.indexOf(main!) - 1]
      return {
        headline: `${above.tier.short} is out of reach from here, and that’s okay.`,
        body: `${main!.tier.name} is still very much possible: get a semester GWA of ${fmt.target(main!.required)} or better in each semester you have left.${pace(res, main!)}`,
        badge: { label: 'Within reach', tone: 'green' },
      }
    }
    case 'stretch':
      return {
        headline: `${stretch!.tier.short} is a stretch: it would take nearly perfect grades.`,
        body:
          main && main !== stretch
            ? `It needs a semester GWA of ${fmt.target(stretch!.required)} or better every semester. It’s possible, so the choice is yours. ${main.tier.name} is the safer goal and still a real achievement: ${fmt.target(main.required)} or better each semester.`
            : `It needs a semester GWA of ${fmt.target(stretch!.required)} or better every semester. It’s possible, so the choice is yours.`,
        badge: { label: 'Stretch', tone: 'gold' },
      }
    case 'locked':
      return {
        headline: `${main!.tier.short} is secure by the numbers.`,
        body: `Even if every remaining grade were ${WORST_GRADE.toFixed(2)}, your GWA would stay in ${main!.tier.short} range. Just keep at least a regular load every semester.`,
        badge: { label: 'Secured', tone: 'green' },
      }
    case 'none':
      return {
        headline: "Latin honors isn’t in the numbers anymore, and it’s okay to feel disappointed.",
        body: "It’s hard work that counts, and your degree and what you’ve learned stay with you. Here’s the best GWA you can still finish with, and what a strong finish looks like.",
        badge: { label: 'Still growing', tone: 'neutral' },
      }
    case 'done':
      return main
        ? {
            headline: `You finished within ${main.tier.name} range.`,
            body: `Your final GWA is ${fmt.gwa(res.cumulativeGwa!)}.`,
            badge: { label: 'Complete', tone: 'green' },
          }
        : {
            headline: `You finished with a GWA of ${res.cumulativeGwa !== null ? fmt.gwa(res.cumulativeGwa) : 'n/a'}.`,
            body: "Latin honors isn’t part of this result, and that’s okay. Your degree and what you’ve learned stay with you.",
            badge: { label: 'Complete', tone: 'neutral' },
          }
  }
}

/** A factual comparison with the student’s own record, instead of calling a target "realistic". */
function pace(res: Results, tier: TierResult): string {
  if (res.cumulativeGwa === null || res.done.length === 0) return ''
  return tier.required >= res.cumulativeGwa - 1e-9
    ? ` That’s no harder than your GWA so far (${fmt.gwa(res.cumulativeGwa)}).`
    : ` That’s a step up from your GWA so far (${fmt.gwa(res.cumulativeGwa)}).`
}

const SHARES: [number, string][] = [
  [1 / 6, '1 in 6'],
  [1 / 5, '1 in 5'],
  [1 / 4, '1 in 4'],
  [1 / 3, '1 in 3'],
  [1 / 2, 'half'],
  [2 / 3, '2 in 3'],
  [3 / 4, '3 in 4'],
  [4 / 5, '4 in 5'],
  [5 / 6, '5 in 6'],
]

/**
 * Plain grades for a target average (grades come in steps of 0.25). The share at the better
 * grade is rounded up, so following the hint always meets the target.
 */
export function mixHint(target: number): string {
  if (target > WORST_GRADE) return 'Any grades keep this one.'
  const mix = gradeMix(target)
  switch (mix.kind) {
    case 'out':
      return 'Not possible with this plan.'
    case 'passing':
      return 'Passing grades (3.00 or better) are enough.'
    case 'all':
      return mix.grade === 1 ? 'Every grade must be 1.00.' : `All ${fmt.grade(mix.grade)}s or better.`
    case 'mix': {
      const share = SHARES.find(([v]) => v >= mix.betterShare - 1e-9)
      if (!share) return `Nearly all ${fmt.grade(mix.better)}s or better.`
      return `About ${share[1]} of your courses at ${fmt.grade(mix.better)}, the rest at ${fmt.grade(mix.worse)} or better.`
    }
  }
}

import { rules } from './rules'

export const REPO_URL = 'https://github.com/Llenoxinn/BELaude'
export const FEEDBACK_URL = `${REPO_URL}/issues/new`
export const PROSPECTUS_ERROR_URL = `${REPO_URL}/issues/new?title=${encodeURIComponent('Prospectus data error: ')}`

/** Typographic year ranges for data strings: "AY 2018-19" becomes "AY 2018–19". */
export function yearRanges(text: string): string {
  return text.replace(/(\d{4})-(\d{2,4})\b/g, '$1–$2')
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-PH', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** The "rules last verified" line shown on the results page and in the footer (plan.md 2). */
export function rulesVerifiedLine(): string {
  const checked = `Honors cutoffs checked against published UP rules on ${formatDate(rules.thresholdsCheckedOn)}.`
  return rules.registrarVerifiedOn
    ? `${checked} Other rules confirmed with the UP Cebu Registrar on ${formatDate(rules.registrarVerifiedOn)}.`
    : `${checked} Other rules are not yet confirmed with the UP Cebu Registrar.`
}

import { rules } from './rules'

export const GITHUB_PROFILE_URL = 'https://github.com/Llenoxinn'
export const REPO_URL = `${GITHUB_PROFILE_URL}/BELaude`
/**
 * Web3Forms access key for in-app reports (set VITE_WEB3FORMS_KEY in .env.local). Web3Forms keys
 * are meant to be public. Without one, reports fall back to a pre-filled GitHub issue.
 */
export const REPORT_KEY: string = import.meta.env.VITE_WEB3FORMS_KEY ?? ''
export const FEEDBACK_URL = `${REPO_URL}/issues/new`
export const PROSPECTUS_ERROR_URL = `${REPO_URL}/issues/new?title=${encodeURIComponent('Prospectus data error: ')}`

/**
 * A pre-filled GitHub issue for a graduate whose official GWA differs from BELaude's. It carries
 * the two GWAs and the program only: never the student's grades.
 */
export function calcReportUrl(d: { ours: string; official: string; program: string; semesters: number }): string {
  const body = [
    'BELaude’s final GWA did not match my official GWA.',
    '',
    `- BELaude: ${d.ours}`,
    `- Official (transcript): ${d.official}`,
    `- Program: ${d.program}`,
    `- Semesters entered: ${d.semesters}`,
    '',
    'What I already checked (edit this):',
    '- [ ] Every semester and midyear I took is listed',
    '- [ ] Units leave out NSTP and PE',
    '- [ ] Grades changed later (INC, 4.00) are updated',
  ].join('\n')
  return `${REPO_URL}/issues/new?title=${encodeURIComponent('GWA mismatch for a graduate')}&body=${encodeURIComponent(body)}`
}

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

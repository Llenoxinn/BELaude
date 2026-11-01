export const GITHUB_PROFILE_URL = 'https://github.com/Llenoxinn'
export const REPO_URL = `${GITHUB_PROFILE_URL}/BELaude`
/**
 * Web3Forms access key for in-app reports (set VITE_WEB3FORMS_KEY in .env.local). Web3Forms keys
 * are meant to be public. Without one, the report popup says reports can't be sent yet.
 */
export const REPORT_KEY: string = import.meta.env.VITE_WEB3FORMS_KEY ?? ''

/** Typographic year ranges for data strings: "AY 2018-19" becomes "AY 2018–19". */
export function yearRanges(text: string): string {
  return text.replace(/(\d{4})-(\d{2,4})\b/g, '$1–$2')
}

export function formatDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('en-PH', { day: 'numeric', month: 'short', year: 'numeric' })
}

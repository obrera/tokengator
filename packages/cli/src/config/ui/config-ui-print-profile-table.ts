import type { ProfileSummary } from '../data-access/config-store'

export function configUiPrintProfileTable(summaries: ProfileSummary[]) {
  console.table(summaries)
}

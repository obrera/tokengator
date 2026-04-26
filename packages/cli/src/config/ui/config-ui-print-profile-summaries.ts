import type { ProfileSummary } from '../data-access/config-store'
import { configUiPrintProfileTable } from './config-ui-print-profile-table'

function configUiPrintNoProfilesConfigured() {
  console.log('No profiles configured.')
  console.log('')
  console.log('Run:')
  console.log('  tokengator config init')
}

export function configUiPrintProfileSummaries(summaries: ProfileSummary[]) {
  if (summaries.length === 0) {
    configUiPrintNoProfilesConfigured()

    return
  }

  configUiPrintProfileTable(summaries)
}

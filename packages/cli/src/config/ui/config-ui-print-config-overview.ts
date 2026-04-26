import type { ProfileSummary } from '../data-access/config-store'
import { formatPathForDisplay } from '../util/config-path-display'
import { configUiPrintProfileTable } from './config-ui-print-profile-table'

export function configUiPrintConfigOverview(options: {
  activeProfile: string
  configExists: boolean
  configPath: string
  summaries: ProfileSummary[]
}) {
  if (options.summaries.length === 0) {
    console.log(options.configExists ? 'No Tokengator profiles configured.' : 'No Tokengator config found.')
    console.log('')
    console.log(`Config path: ${formatPathForDisplay(options.configPath)}`)
    console.log('')
    console.log('Run:')
    console.log('  tokengator config init')

    return
  }

  console.log(`Config path: ${formatPathForDisplay(options.configPath)}`)
  console.log(`Active profile: ${options.activeProfile}`)
  configUiPrintProfileTable(options.summaries)
}

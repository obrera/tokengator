import { outro } from '@clack/prompts'
import pc from 'picocolors'

import { formatPathForDisplay } from '../util/config-path-display'

export function configUiPrintConfigInitSuccess(options: {
  activated: boolean
  configPath: string
  profile: string
  status: 'configured' | 'created'
}) {
  const action = options.status === 'created' ? 'Created' : 'Configured'
  const activation = options.activated ? ' and set it active' : ''

  outro(pc.green(`${action} profile "${options.profile}"${activation} in ${formatPathForDisplay(options.configPath)}.`))
}

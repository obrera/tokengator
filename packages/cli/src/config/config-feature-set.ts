import { Command } from 'commander'

import { setApiUrl } from './data-access/config-store'
import { configUiPrintSetApiUrlSuccess } from './ui/config-ui-print-set-api-url-success'
import { ConfigError } from './util/config-validation'

type ConfigSetOptions = {
  profile?: string
}

export function createConfigSetCommand(): Command {
  return new Command('set')
    .description('Set a local Tokengator config value.')
    .argument('<key>', 'config key to set')
    .argument('<value>', 'config value')
    .option('-p, --profile <name>', 'profile to update')
    .action((key: string, value: string, options: ConfigSetOptions) => {
      if (key !== 'api-url') {
        throw new ConfigError(`Unknown config key "${key}".`)
      }

      const result = setApiUrl(value, { profile: options.profile })

      configUiPrintSetApiUrlSuccess(result.profile)
    })
}

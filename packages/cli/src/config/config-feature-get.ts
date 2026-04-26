import { Command } from 'commander'

import { configExists, getApiUrl, getConfigPath, listProfileSummaries, readConfig } from './data-access/config-store'
import { configUiPrintConfigOverview } from './ui/config-ui-print-config-overview'
import { ConfigError } from './util/config-validation'

type ConfigGetOptions = {
  profile?: string
}

export function createConfigGetCommand(): Command {
  return new Command('get')
    .description('Show the local Tokengator config or read a single config value.')
    .argument('[key]', 'config key to read')
    .option('-p, --profile <name>', 'profile to read')
    .action((key: string | undefined, options: ConfigGetOptions) => {
      if (!key) {
        if (options.profile) {
          throw new ConfigError('--profile can only be used with "tokengator config get api-url".')
        }

        const config = readConfig()

        configUiPrintConfigOverview({
          activeProfile: config.activeProfile,
          configExists: configExists(),
          configPath: getConfigPath(),
          summaries: listProfileSummaries(config),
        })

        return
      }

      if (key !== 'api-url') {
        throw new ConfigError(`Unknown config key "${key}".`)
      }

      console.log(getApiUrl({ profile: options.profile }))
    })
}

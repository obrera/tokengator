import { Command } from 'commander'

import { configApiUrlOptions } from './data-access/config-api-url-options'
import { createProfile, getConfigPath, readConfig, setApiUrl, useProfile } from './data-access/config-store'
import { configUiPrintConfigInitSuccess } from './ui/config-ui-print-config-init-success'
import { configUiPromptInit } from './ui/config-ui-prompt-init'

export function createConfigInitCommand(): Command {
  return new Command('init').description('Interactively create or update local Tokengator config.').action(async () => {
    const config = readConfig()
    const result = await configUiPromptInit({
      apiUrlOptions: configApiUrlOptions,
      config,
    })

    if (!result) {
      return
    }

    if (result.apiUrl) {
      if (result.existingProfile) {
        setApiUrl(result.apiUrl, { profile: result.profile })
      } else {
        createProfile(result.profile, result.apiUrl)
      }
    }

    const activated = config.activeProfile !== result.profile

    if (activated) {
      useProfile(result.profile)
    }

    configUiPrintConfigInitSuccess({
      activated,
      configPath: getConfigPath(),
      profile: result.profile,
      status: result.existingProfile ? 'configured' : 'created',
    })
  })
}

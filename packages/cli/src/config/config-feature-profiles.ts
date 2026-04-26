import { Command } from 'commander'

import { createProfile, deleteProfile, listProfileSummaries, readConfig, useProfile } from './data-access/config-store'
import { configUiPrintCreateProfileSuccess } from './ui/config-ui-print-create-profile-success'
import { configUiPrintDeleteProfileSuccess } from './ui/config-ui-print-delete-profile-success'
import { configUiPrintProfileSummaries } from './ui/config-ui-print-profile-summaries'
import { configUiPrintUseProfileSuccess } from './ui/config-ui-print-use-profile-success'

type ProfileCreateOptions = {
  apiUrl: string
}

export function createConfigProfilesCommand(): Command {
  const profileCommand = new Command('profiles').description('Manage Tokengator config profiles.').action(() => {
    profileCommand.outputHelp()
  })

  profileCommand
    .command('create')
    .description('Create a Tokengator config profile.')
    .argument('<name>', 'profile name')
    .requiredOption('--api-url <url>', 'profile API URL')
    .action((name: string, options: ProfileCreateOptions) => {
      const result = createProfile(name, options.apiUrl)

      configUiPrintCreateProfileSuccess(result.profile)
    })

  profileCommand
    .command('delete')
    .description('Delete a Tokengator config profile.')
    .argument('<name>', 'profile name')
    .action((name: string) => {
      const result = deleteProfile(name)

      configUiPrintDeleteProfileSuccess(result.profile)
    })

  profileCommand
    .command('list')
    .description('List Tokengator config profiles.')
    .action(() => {
      const result = listProfileSummaries(readConfig())

      configUiPrintProfileSummaries(result)
    })

  profileCommand
    .command('use')
    .description('Set the active Tokengator config profile.')
    .argument('<name>', 'profile name')
    .action((name: string) => {
      const result = useProfile(name)

      configUiPrintUseProfileSuccess(result.profile)
    })

  return profileCommand
}

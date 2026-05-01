import { Command } from 'commander'

import { seedFeatureApply } from './seed-feature'

type SeedApplyCommandOptions = {
  apiUrl?: string
  profile?: string
  verbose?: boolean
}

export function createSeedCommand(): Command {
  const seedCommand = new Command('seed').description('Apply Tokengator seed definitions.').action(() => {
    seedCommand.outputHelp()
  })

  seedCommand
    .command('apply')
    .argument('<definition-file>', 'Seed definition JSON file.')
    .description('Apply a seed definition to a local API.')
    .option('--api-url <apiUrl>', 'Override the configured API URL.')
    .option('--profile <profile>', 'Profile to use.')
    .option('--verbose', 'Show API request failure details.')
    .action(async (definitionFile: string, options: SeedApplyCommandOptions) => {
      await seedFeatureApply({
        apiUrl: options.apiUrl,
        definitionFile,
        profile: options.profile,
        verbose: options.verbose,
      })
    })

  return seedCommand
}

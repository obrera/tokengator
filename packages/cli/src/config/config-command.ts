import { Command } from 'commander'

import { createConfigGetCommand } from './config-feature-get'
import { createConfigInitCommand } from './config-feature-init'
import { createConfigPathCommand } from './config-feature-path'
import { createConfigProfilesCommand } from './config-feature-profiles'
import { createConfigSetCommand } from './config-feature-set'

export function createConfigCommand(): Command {
  const configCommand = new Command('config').description('Manage local Tokengator config.').action(() => {
    configCommand.outputHelp()
  })

  configCommand.addCommand(createConfigGetCommand())
  configCommand.addCommand(createConfigInitCommand())
  configCommand.addCommand(createConfigPathCommand())
  configCommand.addCommand(createConfigProfilesCommand())
  configCommand.addCommand(createConfigSetCommand())

  return configCommand
}

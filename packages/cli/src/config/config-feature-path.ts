import { Command } from 'commander'

import { getConfigPath } from './data-access/config-store'

export function createConfigPathCommand(): Command {
  return new Command('path').description('Show the local Tokengator config file path.').action(() => {
    console.log(getConfigPath())
  })
}

#!/usr/bin/env node

import { Command } from 'commander'
import pc from 'picocolors'
import packageJson from '../package.json'
import { AdminApiError } from './api/data-access/admin-api-client'
import { createAssetGroupsCommand } from './asset-groups/asset-groups-command'
import { createAuthCommand } from './auth/auth-command'
import { AuthError } from './auth/data-access/auth-api-client'
import { createCommunitiesCommand } from './communities/communities-command'
import { createCommunityRolesCommand } from './community-roles/community-roles-command'
import { createConfigCommand } from './config/config-command'
import { createSeedCommand } from './seed/seed-command'
import { createUsersCommand } from './users/users-command'

function createProgram(): Command {
  const program = new Command()
    .name(packageJson.name)
    .description(packageJson.description)
    .version(packageJson.version)
    .action(() => {
      program.outputHelp()
    })

  program.addCommand(createAssetGroupsCommand())
  program.addCommand(createAuthCommand())
  program.addCommand(createCommunityRolesCommand())
  program.addCommand(createCommunitiesCommand())
  program.addCommand(createConfigCommand())
  program.addCommand(createSeedCommand())
  program.addCommand(createUsersCommand())

  return program
}

async function main() {
  await createProgram().parseAsync(process.argv)
}

function printCliError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unexpected error'

  console.error(pc.red(message))

  if ((error instanceof AdminApiError || error instanceof AuthError) && error.details?.length) {
    for (const detail of error.details) {
      console.error(pc.dim(detail))
    }
  }
}

main().catch((error: unknown) => {
  printCliError(error)
  process.exitCode = 1
})

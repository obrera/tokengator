import { Command, InvalidArgumentError } from 'commander'

import { addCommonAdminOptions } from '../api/util/command-options'
import { usersFeatureCreate } from './users-feature-create'
import { usersFeatureGet } from './users-feature-get'
import { usersFeatureLinkDiscord } from './users-feature-link-discord'
import { usersFeatureLinkSolana } from './users-feature-link-solana'
import { usersFeatureList } from './users-feature-list'
import { usersFeatureUpdate } from './users-feature-update'

type UserRole = 'admin' | 'user'

type UsersCreateCommandOptions = {
  email: string
  emailUnverified?: boolean
  image?: string
  json?: boolean
  name: string
  profile?: string
  role?: UserRole
  username?: string
  verbose?: boolean
}

type UsersGetCommandOptions = {
  json?: boolean
  profile?: string
  verbose?: boolean
}

type UsersLinkDiscordCommandOptions = {
  accountId: string
  json?: boolean
  profile?: string
  verbose?: boolean
}

type UsersLinkSolanaCommandOptions = {
  address: string
  json?: boolean
  name?: string
  primary?: boolean
  profile?: string
  verbose?: boolean
}

type UsersListCommandOptions = {
  json?: boolean
  profile?: string
  search?: string
  verbose?: boolean
}

type UsersUpdateCommandOptions = {
  email?: string
  emailUnverified?: boolean
  emailVerified?: boolean
  image?: string
  json?: boolean
  name?: string
  profile?: string
  role?: UserRole
  username?: string
  verbose?: boolean
}

function parseUserRole(value: string): UserRole {
  if (value !== 'admin' && value !== 'user') {
    throw new InvalidArgumentError('role must be admin or user.')
  }

  return value
}

export function createUsersCommand(): Command {
  const usersCommand = new Command('users').description('Manage Tokengator users.').action(() => {
    usersCommand.outputHelp()
  })

  addCommonAdminOptions(
    usersCommand
      .command('create')
      .description('Create a user.')
      .requiredOption('--email <email>', 'User email.')
      .requiredOption('--name <name>', 'User name.')
      .option('--email-unverified', 'Create the user with an unverified email.')
      .option('--image <image>', 'User image URL.')
      .option('--role <role>', 'User role.', parseUserRole)
      .option('--username <username>', 'Username.'),
  ).action(async (options: UsersCreateCommandOptions) => {
    await usersFeatureCreate(options)
  })

  addCommonAdminOptions(
    usersCommand.command('get').argument('<user-id>', 'User ID.').description('Show a user.'),
  ).action(async (userId: string, options: UsersGetCommandOptions) => {
    await usersFeatureGet(userId, options)
  })

  addCommonAdminOptions(
    usersCommand
      .command('link-discord')
      .argument('<user-id>', 'User ID.')
      .description('Link a Discord account to a user.')
      .requiredOption('--account-id <accountId>', 'Discord account ID.'),
  ).action(async (userId: string, options: UsersLinkDiscordCommandOptions) => {
    await usersFeatureLinkDiscord(userId, options)
  })

  addCommonAdminOptions(
    usersCommand
      .command('link-solana')
      .argument('<user-id>', 'User ID.')
      .description('Link a Solana wallet to a user.')
      .requiredOption('--address <address>', 'Solana wallet address.')
      .option('--name <name>', 'Wallet display name.')
      .option('--primary', 'Set as the primary wallet.'),
  ).action(async (userId: string, options: UsersLinkSolanaCommandOptions) => {
    await usersFeatureLinkSolana(userId, options)
  })

  addCommonAdminOptions(
    usersCommand.command('list').description('List users.').option('--search <search>', 'Search by name or username.'),
  ).action(async (options: UsersListCommandOptions) => {
    await usersFeatureList(options)
  })

  addCommonAdminOptions(
    usersCommand
      .command('update')
      .argument('<user-id>', 'User ID.')
      .description('Update a user.')
      .option('--email <email>', 'User email.')
      .option('--email-unverified', 'Mark the user email as unverified.')
      .option('--email-verified', 'Mark the user email as verified.')
      .option('--image <image>', 'User image URL.')
      .option('--name <name>', 'User name.')
      .option('--role <role>', 'User role.', parseUserRole)
      .option('--username <username>', 'Username.'),
  ).action(async (userId: string, options: UsersUpdateCommandOptions) => {
    if (options.emailUnverified && options.emailVerified) {
      throw new InvalidArgumentError('Use either --email-unverified or --email-verified, not both.')
    }

    await usersFeatureUpdate(userId, options)
  })

  return usersCommand
}

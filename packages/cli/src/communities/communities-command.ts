import { Command, InvalidArgumentError } from 'commander'

import { addCommonAdminOptions, parseIntegerOption } from '../api/util/command-options'
import { communitiesFeatureCreate } from './communities-feature-create'
import { communitiesFeatureDelete } from './communities-feature-delete'
import { communitiesFeatureDiscordConnect } from './communities-feature-discord-connect'
import { communitiesFeatureGet } from './communities-feature-get'
import { communitiesFeatureList } from './communities-feature-list'
import { communitiesFeatureMembersAdd } from './communities-feature-members-add'
import { communitiesFeatureOwnerCandidates } from './communities-feature-owner-candidates'
import { communitiesFeatureUpdate } from './communities-feature-update'

type CommunityMemberRole = 'admin' | 'member' | 'owner'

type CommunitiesCreateCommandOptions = {
  json?: boolean
  logo?: string
  name: string
  ownerUserId: string
  profile?: string
  slug: string
  verbose?: boolean
}

type CommunitiesDeleteCommandOptions = {
  json?: boolean
  profile?: string
  verbose?: boolean
  yes?: boolean
}

type CommunitiesGetCommandOptions = {
  json?: boolean
  profile?: string
  verbose?: boolean
}

type CommunitiesDiscordConnectCommandOptions = {
  guildId: string
  json?: boolean
  profile?: string
  verbose?: boolean
}

type CommunitiesListCommandOptions = {
  json?: boolean
  limit?: number
  offset?: number
  profile?: string
  search?: string
  verbose?: boolean
}

type CommunitiesMembersAddCommandOptions = {
  json?: boolean
  profile?: string
  role: CommunityMemberRole
  userId: string
  verbose?: boolean
}

type CommunitiesOwnerCandidatesCommandOptions = {
  json?: boolean
  limit?: number
  profile?: string
  search?: string
  verbose?: boolean
}

type CommunitiesUpdateCommandOptions = {
  clearDescription?: boolean
  clearDiscordUrl?: boolean
  clearGithubUrl?: boolean
  clearLogo?: boolean
  clearTelegramUrl?: boolean
  clearWebsiteUrl?: boolean
  clearXUrl?: boolean
  description?: string
  discordUrl?: string
  githubUrl?: string
  json?: boolean
  logo?: string
  name?: string
  profile?: string
  slug?: string
  telegramUrl?: string
  verbose?: boolean
  websiteUrl?: string
  xUrl?: string
}

function parseLimit(value: string) {
  return parseIntegerOption(value, {
    max: 100,
    min: 1,
    name: 'limit',
  })
}

function parseOffset(value: string) {
  return parseIntegerOption(value, {
    min: 0,
    name: 'offset',
  })
}

function parseOwnerCandidateLimit(value: string) {
  return parseIntegerOption(value, {
    max: 20,
    min: 1,
    name: 'limit',
  })
}

function parseCommunityMemberRole(value: string): CommunityMemberRole {
  if (value !== 'admin' && value !== 'member' && value !== 'owner') {
    throw new InvalidArgumentError('role must be admin, member, or owner.')
  }

  return value
}

export function createCommunitiesCommand(): Command {
  const communitiesCommand = new Command('communities').description('Manage Tokengator communities.').action(() => {
    communitiesCommand.outputHelp()
  })

  addCommonAdminOptions(
    communitiesCommand
      .command('create')
      .description('Create a community.')
      .requiredOption('--name <name>', 'Community name.')
      .requiredOption('--owner-user-id <ownerUserId>', 'Initial owner user ID.')
      .requiredOption('--slug <slug>', 'Community slug.')
      .option('--logo <logo>', 'Community logo URL.'),
  ).action(async (options: CommunitiesCreateCommandOptions) => {
    await communitiesFeatureCreate(options)
  })

  addCommonAdminOptions(
    communitiesCommand
      .command('delete')
      .argument('<organization-id>', 'Community organization ID.')
      .description('Delete a community.')
      .option('--yes', 'Confirm deletion without prompting.'),
  ).action(async (organizationId: string, options: CommunitiesDeleteCommandOptions) => {
    await communitiesFeatureDelete(organizationId, options)
  })

  addCommonAdminOptions(
    communitiesCommand
      .command('get')
      .argument('<organization-id>', 'Community organization ID.')
      .description('Show a community.'),
  ).action(async (organizationId: string, options: CommunitiesGetCommandOptions) => {
    await communitiesFeatureGet(organizationId, options)
  })

  const discordCommand = communitiesCommand.command('discord').description('Manage community Discord connections.')

  addCommonAdminOptions(
    discordCommand
      .command('connect')
      .argument('<organization-id>', 'Community organization ID.')
      .description('Connect a Discord guild to a community.')
      .requiredOption('--guild-id <guildId>', 'Discord guild ID.'),
  ).action(async (organizationId: string, options: CommunitiesDiscordConnectCommandOptions) => {
    await communitiesFeatureDiscordConnect(organizationId, options)
  })

  addCommonAdminOptions(
    communitiesCommand
      .command('list')
      .description('List communities.')
      .option('--limit <limit>', 'Maximum number of communities to return.', parseLimit)
      .option('--offset <offset>', 'Number of communities to skip.', parseOffset)
      .option('--search <search>', 'Search by name or slug.'),
  ).action(async (options: CommunitiesListCommandOptions) => {
    await communitiesFeatureList(options)
  })

  const membersCommand = communitiesCommand.command('members').description('Manage community members.')

  addCommonAdminOptions(
    membersCommand
      .command('add')
      .argument('<organization-id>', 'Community organization ID.')
      .description('Add a user to a community.')
      .requiredOption('--role <role>', 'Community member role.', parseCommunityMemberRole)
      .requiredOption('--user-id <userId>', 'User ID.'),
  ).action(async (organizationId: string, options: CommunitiesMembersAddCommandOptions) => {
    await communitiesFeatureMembersAdd(organizationId, options)
  })

  addCommonAdminOptions(
    communitiesCommand
      .command('owner-candidates')
      .description('List users who can own a new community.')
      .option('--limit <limit>', 'Maximum number of users to return.', parseOwnerCandidateLimit)
      .option('--search <search>', 'Search by name or username.'),
  ).action(async (options: CommunitiesOwnerCandidatesCommandOptions) => {
    await communitiesFeatureOwnerCandidates(options)
  })

  addCommonAdminOptions(
    communitiesCommand
      .command('update')
      .argument('<organization-id>', 'Community organization ID.')
      .description('Update a community.')
      .option('--clear-description', 'Clear the community description.')
      .option('--clear-discord-url', 'Clear the Discord URL.')
      .option('--clear-github-url', 'Clear the GitHub URL.')
      .option('--clear-logo', 'Clear the logo URL.')
      .option('--clear-telegram-url', 'Clear the Telegram URL.')
      .option('--clear-website-url', 'Clear the website URL.')
      .option('--clear-x-url', 'Clear the X URL.')
      .option('--description <description>', 'Community description.')
      .option('--discord-url <discordUrl>', 'Discord URL.')
      .option('--github-url <githubUrl>', 'GitHub URL.')
      .option('--logo <logo>', 'Logo URL.')
      .option('--name <name>', 'Community name.')
      .option('--slug <slug>', 'Community slug.')
      .option('--telegram-url <telegramUrl>', 'Telegram URL.')
      .option('--website-url <websiteUrl>', 'Website URL.')
      .option('--x-url <xUrl>', 'X URL.'),
  ).action(async (organizationId: string, options: CommunitiesUpdateCommandOptions) => {
    await communitiesFeatureUpdate(organizationId, options)
  })

  return communitiesCommand
}

import { Command, InvalidArgumentError } from 'commander'

import type { AdminAssetGroupResolverKind, AdminAssetGroupType } from '../api/data-access/admin-api-client'
import { addCommonAdminOptions, parseIntegerOption } from '../api/util/command-options'
import {
  assetGroupsFeatureCreate,
  assetGroupsFeatureDelete,
  assetGroupsFeatureGet,
  assetGroupsFeatureIndex,
  assetGroupsFeatureIndexRuns,
  assetGroupsFeatureList,
  assetGroupsFeatureLookup,
  assetGroupsFeatureUpdate,
} from './asset-groups-feature'

type AssetGroupsCreateCommandOptions = {
  address: string
  decimals?: number
  disabled?: boolean
  imageUrl?: string
  json?: boolean
  label: string
  profile?: string
  resolverKind?: AdminAssetGroupResolverKind
  symbol?: string
  type: AdminAssetGroupType
  verbose?: boolean
}

type AssetGroupsDeleteCommandOptions = {
  json?: boolean
  profile?: string
  verbose?: boolean
  yes?: boolean
}

type AssetGroupsGetCommandOptions = {
  json?: boolean
  profile?: string
  verbose?: boolean
}

type AssetGroupsIndexCommandOptions = {
  json?: boolean
  profile?: string
  verbose?: boolean
}

type AssetGroupsIndexRunsCommandOptions = {
  json?: boolean
  limit?: number
  profile?: string
  verbose?: boolean
}

type AssetGroupsListCommandOptions = {
  json?: boolean
  limit?: number
  offset?: number
  profile?: string
  search?: string
  verbose?: boolean
}

type AssetGroupsLookupCommandOptions = {
  json?: boolean
  profile?: string
  verbose?: boolean
}

type AssetGroupsUpdateCommandOptions = {
  address?: string
  clearImageUrl?: boolean
  clearSymbol?: boolean
  decimals?: number
  disabled?: boolean
  enabled?: boolean
  imageUrl?: string
  json?: boolean
  label?: string
  profile?: string
  resolverKind?: AdminAssetGroupResolverKind
  symbol?: string
  type?: AdminAssetGroupType
  verbose?: boolean
}

const ASSET_GROUP_RESOLVER_KINDS = ['helius-collection-assets', 'helius-token-accounts', 'realms-voters'] as const
const ASSET_GROUP_TYPES = ['collection', 'mint'] as const

function parseAssetGroupType(value: string): AdminAssetGroupType {
  if (!ASSET_GROUP_TYPES.includes(value as (typeof ASSET_GROUP_TYPES)[number])) {
    throw new InvalidArgumentError('type must be collection or mint.')
  }

  return value as AdminAssetGroupType
}

function parseDecimals(value: string) {
  return parseIntegerOption(value, {
    max: 255,
    min: 0,
    name: 'decimals',
  })
}

function parseIndexRunLimit(value: string) {
  return parseIntegerOption(value, {
    max: 50,
    min: 1,
    name: 'limit',
  })
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

function parseResolverKind(value: string): AdminAssetGroupResolverKind {
  if (!ASSET_GROUP_RESOLVER_KINDS.includes(value as (typeof ASSET_GROUP_RESOLVER_KINDS)[number])) {
    throw new InvalidArgumentError(
      'resolver-kind must be helius-collection-assets, helius-token-accounts, or realms-voters.',
    )
  }

  return value as AdminAssetGroupResolverKind
}

export function createAssetGroupsCommand(): Command {
  const assetGroupsCommand = new Command('asset-groups').description('Manage Tokengator asset groups.').action(() => {
    assetGroupsCommand.outputHelp()
  })

  addCommonAdminOptions(
    assetGroupsCommand
      .command('create')
      .description('Create an asset group.')
      .requiredOption('--address <address>', 'Asset group address.')
      .requiredOption('--label <label>', 'Asset group label.')
      .requiredOption('--type <type>', 'Asset group type.', parseAssetGroupType)
      .option('--decimals <decimals>', 'Token decimals.', parseDecimals)
      .option('--disabled', 'Create the asset group disabled.')
      .option('--image-url <imageUrl>', 'Asset group image URL.')
      .option('--resolver-kind <resolverKind>', 'Asset group resolver kind.', parseResolverKind)
      .option('--symbol <symbol>', 'Asset group symbol.'),
  ).action(async (options: AssetGroupsCreateCommandOptions) => {
    await assetGroupsFeatureCreate(options)
  })

  addCommonAdminOptions(
    assetGroupsCommand
      .command('delete')
      .argument('<asset-group-id>', 'Asset group ID.')
      .description('Delete an asset group.')
      .option('--yes', 'Confirm deletion without prompting.'),
  ).action(async (assetGroupId: string, options: AssetGroupsDeleteCommandOptions) => {
    await assetGroupsFeatureDelete(assetGroupId, options)
  })

  addCommonAdminOptions(
    assetGroupsCommand
      .command('get')
      .argument('<asset-group-id>', 'Asset group ID.')
      .description('Show an asset group.'),
  ).action(async (assetGroupId: string, options: AssetGroupsGetCommandOptions) => {
    await assetGroupsFeatureGet(assetGroupId, options)
  })

  addCommonAdminOptions(
    assetGroupsCommand
      .command('index')
      .argument('<asset-group-id>', 'Asset group ID.')
      .description('Index an asset group.'),
  ).action(async (assetGroupId: string, options: AssetGroupsIndexCommandOptions) => {
    await assetGroupsFeatureIndex(assetGroupId, options)
  })

  addCommonAdminOptions(
    assetGroupsCommand
      .command('index-runs')
      .argument('<asset-group-id>', 'Asset group ID.')
      .description('List asset group index runs.')
      .option('--limit <limit>', 'Maximum number of runs to return.', parseIndexRunLimit),
  ).action(async (assetGroupId: string, options: AssetGroupsIndexRunsCommandOptions) => {
    await assetGroupsFeatureIndexRuns(assetGroupId, options)
  })

  addCommonAdminOptions(
    assetGroupsCommand
      .command('list')
      .description('List asset groups.')
      .option('--limit <limit>', 'Maximum number of asset groups to return.', parseLimit)
      .option('--offset <offset>', 'Number of asset groups to skip.', parseOffset)
      .option('--search <search>', 'Search by address, label, or type.'),
  ).action(async (options: AssetGroupsListCommandOptions) => {
    await assetGroupsFeatureList(options)
  })

  addCommonAdminOptions(
    assetGroupsCommand
      .command('lookup')
      .argument('<address>', 'Solana address to inspect.')
      .description('Look up asset group metadata by address.'),
  ).action(async (address: string, options: AssetGroupsLookupCommandOptions) => {
    await assetGroupsFeatureLookup(address, options)
  })

  addCommonAdminOptions(
    assetGroupsCommand
      .command('update')
      .argument('<asset-group-id>', 'Asset group ID.')
      .description('Update an asset group.')
      .option('--address <address>', 'Asset group address.')
      .option('--clear-image-url', 'Clear the image URL.')
      .option('--clear-symbol', 'Clear the symbol.')
      .option('--decimals <decimals>', 'Token decimals.', parseDecimals)
      .option('--disabled', 'Disable the asset group.')
      .option('--enabled', 'Enable the asset group.')
      .option('--image-url <imageUrl>', 'Image URL.')
      .option('--label <label>', 'Asset group label.')
      .option('--resolver-kind <resolverKind>', 'Resolver kind.', parseResolverKind)
      .option('--symbol <symbol>', 'Symbol.')
      .option('--type <type>', 'Asset group type.', parseAssetGroupType),
  ).action(async (assetGroupId: string, options: AssetGroupsUpdateCommandOptions) => {
    await assetGroupsFeatureUpdate(assetGroupId, options)
  })

  return assetGroupsCommand
}

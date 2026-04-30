import type {
  AdminApiClient,
  AdminApiFetch,
  AdminAssetGroup,
  AdminAssetGroupListInput,
  AdminAssetGroupResolverKind,
  AdminAssetGroupType,
} from '../api/data-access/admin-api-client'
import type { ProfileOptions } from '../config/data-access/config-store'
import { createAdminApiClient } from '../api/data-access/admin-api-client'
import { confirmDestructiveAction, printJson } from '../api/ui/api-output'
import { getOptionalNumber, getOptionalString, pickDefined } from '../api/util/command-options'
import {
  assetGroupsUiPrintAssetGroup,
  assetGroupsUiPrintAssetGroupDeleted,
  assetGroupsUiPrintAssetGroupList,
  assetGroupsUiPrintIndexResult,
  assetGroupsUiPrintIndexRuns,
  assetGroupsUiPrintLookup,
} from './asset-groups-ui'

type AssetGroupsFeatureOptions = ProfileOptions & {
  apiClient?: AdminApiClient
  fetch?: AdminApiFetch
  json?: boolean
  signal?: AbortSignal
  verbose?: boolean
}

type AssetGroupsCreateOptions = AssetGroupsFeatureOptions & {
  address: string
  decimals?: number
  disabled?: boolean
  imageUrl?: string
  label: string
  resolverKind?: AdminAssetGroupResolverKind
  symbol?: string
  type: AdminAssetGroupType
}

type AssetGroupsDeleteOptions = AssetGroupsFeatureOptions & {
  yes?: boolean
}

type AssetGroupsIndexRunsOptions = AssetGroupsFeatureOptions & {
  limit?: number
}

type AssetGroupsListOptions = AssetGroupsFeatureOptions & {
  limit?: number
  offset?: number
  search?: string
}

type AssetGroupsUpdateOptions = AssetGroupsFeatureOptions & {
  address?: string
  clearImageUrl?: boolean
  clearSymbol?: boolean
  decimals?: number
  disabled?: boolean
  enabled?: boolean
  imageUrl?: string
  label?: string
  resolverKind?: AdminAssetGroupResolverKind
  symbol?: string
  type?: AdminAssetGroupType
}

function getApiClient(options: AssetGroupsFeatureOptions): AdminApiClient {
  return (
    options.apiClient ??
    createAdminApiClient({
      configPath: options.configPath,
      env: options.env,
      fetch: options.fetch,
      profile: options.profile,
      signal: options.signal,
      verbose: options.verbose,
    })
  )
}

function getEnabledValue(options: Pick<AssetGroupsUpdateOptions, 'disabled' | 'enabled'>, current: boolean): boolean {
  if (options.disabled && options.enabled) {
    throw new Error('Use either --enabled or --disabled.')
  }

  if (options.disabled) {
    return false
  }

  if (options.enabled) {
    return true
  }

  return current
}

function getMergedNullableText(input: {
  clear?: boolean
  current?: string | null
  optionName: string
  value?: string
}): string | null {
  if (input.clear && input.value !== undefined) {
    throw new Error(`Use either --${input.optionName} or --clear-${input.optionName}.`)
  }

  if (input.clear) {
    return null
  }

  if (input.value !== undefined) {
    return input.value
  }

  return input.current ?? null
}

function isResolverKindCompatible(input: {
  resolverKind: AdminAssetGroupResolverKind
  type: AdminAssetGroupType
}): boolean {
  if (input.type === 'collection') {
    return input.resolverKind === 'helius-collection-assets'
  }

  return input.resolverKind === 'helius-token-accounts' || input.resolverKind === 'realms-voters'
}

function getMergedResolverKind(input: {
  currentResolverKind: AdminAssetGroupResolverKind
  currentType: AdminAssetGroupType
  resolverKind?: AdminAssetGroupResolverKind
  type?: AdminAssetGroupType
}): AdminAssetGroupResolverKind | undefined {
  if (input.resolverKind) {
    return input.resolverKind
  }

  const nextType = input.type ?? input.currentType

  if (!isResolverKindCompatible({ resolverKind: input.currentResolverKind, type: nextType })) {
    throw new Error('Use --resolver-kind when changing to a type that is incompatible with the current resolver kind.')
  }

  return input.currentResolverKind
}

function requireAssetGroup(assetGroup: AdminAssetGroup | null, assetGroupId: string): AdminAssetGroup {
  if (!assetGroup) {
    throw new Error(`Asset group "${assetGroupId}" was not found.`)
  }

  return assetGroup
}

export async function assetGroupsFeatureCreate(options: AssetGroupsCreateOptions) {
  const apiClient = getApiClient(options)
  const assetGroup = await apiClient.assetGroupCreate({
    address: options.address,
    label: options.label,
    type: options.type,
    ...pickDefined({
      decimals: getOptionalNumber(options.decimals),
      enabled: options.disabled ? false : undefined,
      imageUrl: getOptionalString(options.imageUrl),
      resolverKind: options.resolverKind,
      symbol: getOptionalString(options.symbol),
    }),
  })

  if (options.json) {
    printJson(assetGroup)
    return
  }

  assetGroupsUiPrintAssetGroup(assetGroup)
}

export async function assetGroupsFeatureDelete(assetGroupId: string, options: AssetGroupsDeleteOptions) {
  await confirmDestructiveAction({
    message: `Delete asset group "${assetGroupId}"?`,
    yes: options.yes,
  })

  const apiClient = getApiClient(options)
  const result = await apiClient.assetGroupDelete({ assetGroupId })

  if (options.json) {
    printJson(result)
    return
  }

  assetGroupsUiPrintAssetGroupDeleted(result.assetGroupId)
}

export async function assetGroupsFeatureGet(assetGroupId: string, options: AssetGroupsFeatureOptions) {
  const apiClient = getApiClient(options)
  const assetGroup = requireAssetGroup(await apiClient.assetGroupGet({ assetGroupId }), assetGroupId)

  if (options.json) {
    printJson(assetGroup)
    return
  }

  assetGroupsUiPrintAssetGroup(assetGroup)
}

export async function assetGroupsFeatureIndex(assetGroupId: string, options: AssetGroupsFeatureOptions) {
  const apiClient = getApiClient(options)
  const result = await apiClient.assetGroupIndex({ assetGroupId })

  if (options.json) {
    printJson(result)
    return
  }

  assetGroupsUiPrintIndexResult(result)
}

export async function assetGroupsFeatureIndexRuns(assetGroupId: string, options: AssetGroupsIndexRunsOptions) {
  const apiClient = getApiClient(options)
  const result = await apiClient.assetGroupListIndexRuns({
    assetGroupId,
    ...pickDefined({
      limit: getOptionalNumber(options.limit),
    }),
  })

  if (options.json) {
    printJson(result)
    return
  }

  assetGroupsUiPrintIndexRuns(result.indexRuns)
}

export async function assetGroupsFeatureList(options: AssetGroupsListOptions) {
  const apiClient = getApiClient(options)
  const input = pickDefined<AdminAssetGroupListInput>({
    limit: getOptionalNumber(options.limit),
    offset: getOptionalNumber(options.offset),
    search: getOptionalString(options.search),
  })
  const result = await apiClient.assetGroupList(input)

  if (options.json) {
    printJson(result)
    return
  }

  assetGroupsUiPrintAssetGroupList(result)
}

export async function assetGroupsFeatureLookup(address: string, options: AssetGroupsFeatureOptions) {
  const apiClient = getApiClient(options)
  const result = await apiClient.assetGroupLookup({ address })

  if (options.json) {
    printJson(result)
    return
  }

  assetGroupsUiPrintLookup(result)
}

export async function assetGroupsFeatureUpdate(assetGroupId: string, options: AssetGroupsUpdateOptions) {
  const apiClient = getApiClient(options)
  const current = requireAssetGroup(await apiClient.assetGroupGet({ assetGroupId }), assetGroupId)
  const type = options.type ?? current.type
  const assetGroup = await apiClient.assetGroupUpdate({
    assetGroupId,
    data: {
      address: options.address ?? current.address,
      decimals: options.decimals ?? current.decimals,
      enabled: getEnabledValue(options, current.enabled),
      imageUrl: getMergedNullableText({
        clear: options.clearImageUrl,
        current: current.imageUrl,
        optionName: 'image-url',
        value: options.imageUrl,
      }),
      label: options.label ?? current.label,
      resolverKind: getMergedResolverKind({
        currentResolverKind: current.resolverKind,
        currentType: current.type,
        resolverKind: options.resolverKind,
        type: options.type,
      }),
      symbol: getMergedNullableText({
        clear: options.clearSymbol,
        current: current.symbol,
        optionName: 'symbol',
        value: options.symbol,
      }),
      type,
    },
  })

  if (options.json) {
    printJson(assetGroup)
    return
  }

  assetGroupsUiPrintAssetGroup(assetGroup)
}

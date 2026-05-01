import {
  type AdminAssetGroup,
  type AdminAssetGroupResolverKind,
  type AdminAssetGroupType,
  type ApiClientOptions,
} from '../api/data-access/admin-api-client'
import { getApiClient } from '../api/data-access/get-api-client'
import { coreUiJson } from '../core/ui/core-ui-json'
import { assetGroupsUiPrintAssetGroup } from './ui/asset-groups-ui-print-asset-group'

type AssetGroupsUpdateOptions = ApiClientOptions & {
  address?: string
  clearImageUrl?: boolean
  clearSymbol?: boolean
  decimals?: number
  disabled?: boolean
  enabled?: boolean
  imageUrl?: string
  json?: boolean
  label?: string
  resolverKind?: AdminAssetGroupResolverKind
  symbol?: string
  type?: AdminAssetGroupType
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
  const nextType = input.type ?? input.currentType

  if (input.resolverKind) {
    if (!isResolverKindCompatible({ resolverKind: input.resolverKind, type: nextType })) {
      throw new Error('Use a resolver kind that is compatible with the selected type.')
    }

    return input.resolverKind
  }

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
    coreUiJson(assetGroup)
    return
  }

  assetGroupsUiPrintAssetGroup(assetGroup)
}

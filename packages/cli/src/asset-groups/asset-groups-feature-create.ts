import {
  type AdminAssetGroupResolverKind,
  type AdminAssetGroupType,
  type ApiClientOptions,
} from '../api/data-access/admin-api-client'
import { getApiClient } from '../api/data-access/get-api-client'
import { getOptionalNumber, getOptionalString, pickDefined } from '../api/util/command-options'
import { coreUiJson } from '../core/ui/core-ui-json'
import { assetGroupsUiPrintAssetGroup } from './ui/asset-groups-ui-print-asset-group'

type AssetGroupsCreateOptions = ApiClientOptions & {
  address: string
  decimals?: number
  disabled?: boolean
  imageUrl?: string
  json?: boolean
  label: string
  resolverKind?: AdminAssetGroupResolverKind
  symbol?: string
  type: AdminAssetGroupType
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
    coreUiJson(assetGroup)
    return
  }

  assetGroupsUiPrintAssetGroup(assetGroup)
}

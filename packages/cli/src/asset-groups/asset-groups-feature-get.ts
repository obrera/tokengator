import { type AdminAssetGroup, type ApiClientOptions } from '../api/data-access/admin-api-client'
import { getApiClient } from '../api/data-access/get-api-client'
import { coreUiJson } from '../core/ui/core-ui-json'
import { assetGroupsUiPrintAssetGroup } from './ui/asset-groups-ui-print-asset-group'

type AssetGroupsGetOptions = ApiClientOptions & {
  json?: boolean
}

function requireAssetGroup(assetGroup: AdminAssetGroup | null, assetGroupId: string): AdminAssetGroup {
  if (!assetGroup) {
    throw new Error(`Asset group "${assetGroupId}" was not found.`)
  }

  return assetGroup
}

export async function assetGroupsFeatureGet(assetGroupId: string, options: AssetGroupsGetOptions) {
  const apiClient = getApiClient(options)
  const assetGroup = requireAssetGroup(await apiClient.assetGroupGet({ assetGroupId }), assetGroupId)

  if (options.json) {
    coreUiJson(assetGroup)
    return
  }

  assetGroupsUiPrintAssetGroup(assetGroup)
}

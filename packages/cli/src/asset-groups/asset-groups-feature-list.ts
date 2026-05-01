import { type AdminAssetGroupListInput, type ApiClientOptions } from '../api/data-access/admin-api-client'
import { getApiClient } from '../api/data-access/get-api-client'
import { getOptionalNumber, getOptionalString, pickDefined } from '../api/util/command-options'
import { coreUiJson } from '../core/ui/core-ui-json'
import { assetGroupsUiPrintAssetGroupList } from './ui/asset-groups-ui-print-asset-group-list'

type AssetGroupsListOptions = ApiClientOptions & {
  json?: boolean
  limit?: number
  offset?: number
  search?: string
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
    coreUiJson(result)
    return
  }

  assetGroupsUiPrintAssetGroupList(result)
}

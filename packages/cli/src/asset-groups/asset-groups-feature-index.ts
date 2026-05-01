import { type ApiClientOptions } from '../api/data-access/admin-api-client'
import { getApiClient } from '../api/data-access/get-api-client'
import { coreUiJson } from '../core/ui/core-ui-json'
import { assetGroupsUiPrintIndexResult } from './ui/asset-groups-ui-print-index-result'

type AssetGroupsIndexOptions = ApiClientOptions & {
  json?: boolean
}

export async function assetGroupsFeatureIndex(assetGroupId: string, options: AssetGroupsIndexOptions) {
  const apiClient = getApiClient(options)
  const result = await apiClient.assetGroupIndex({ assetGroupId })

  if (options.json) {
    coreUiJson(result)
    return
  }

  assetGroupsUiPrintIndexResult(result)
}

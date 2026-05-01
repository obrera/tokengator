import { type ApiClientOptions } from '../api/data-access/admin-api-client'
import { getApiClient } from '../api/data-access/get-api-client'
import { coreUiJson } from '../core/ui/core-ui-json'
import { assetGroupsUiPrintLookup } from './ui/asset-groups-ui-print-lookup'

type AssetGroupsLookupOptions = ApiClientOptions & {
  json?: boolean
}

export async function assetGroupsFeatureLookup(address: string, options: AssetGroupsLookupOptions) {
  const apiClient = getApiClient(options)
  const result = await apiClient.assetGroupLookup({ address })

  if (options.json) {
    coreUiJson(result)
    return
  }

  assetGroupsUiPrintLookup(result)
}

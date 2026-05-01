import { type ApiClientOptions } from '../api/data-access/admin-api-client'
import { getApiClient } from '../api/data-access/get-api-client'
import { getOptionalNumber, pickDefined } from '../api/util/command-options'
import { coreUiJson } from '../core/ui/core-ui-json'
import { assetGroupsUiPrintIndexRuns } from './ui/asset-groups-ui-print-index-runs'

type AssetGroupsIndexRunsOptions = ApiClientOptions & {
  json?: boolean
  limit?: number
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
    coreUiJson(result)
    return
  }

  assetGroupsUiPrintIndexRuns(result.indexRuns)
}

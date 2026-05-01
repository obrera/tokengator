import { type ApiClientOptions } from '../api/data-access/admin-api-client'
import { getApiClient } from '../api/data-access/get-api-client'
import { coreUiConfirmDestructiveAction } from '../core/ui/core-ui-confirm-destructive-action'
import { coreUiJson } from '../core/ui/core-ui-json'
import { assetGroupsUiPrintAssetGroupDeleted } from './ui/asset-groups-ui-print-asset-group-deleted'

type AssetGroupsDeleteOptions = ApiClientOptions & {
  json?: boolean
  yes?: boolean
}

export async function assetGroupsFeatureDelete(assetGroupId: string, options: AssetGroupsDeleteOptions) {
  await coreUiConfirmDestructiveAction({
    message: `Delete asset group "${assetGroupId}"?`,
    yes: options.yes,
  })

  const apiClient = getApiClient(options)
  const result = await apiClient.assetGroupDelete({ assetGroupId })

  if (options.json) {
    coreUiJson(result)
    return
  }

  assetGroupsUiPrintAssetGroupDeleted(result.assetGroupId)
}

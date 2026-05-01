import { type ApiClientOptions } from '../api/data-access/admin-api-client'
import { getApiClient } from '../api/data-access/get-api-client'
import { coreUiConfirmDestructiveAction } from '../core/ui/core-ui-confirm-destructive-action'
import { coreUiJson } from '../core/ui/core-ui-json'
import { communitiesUiPrintCommunityDeleted } from './ui/communities-ui-print-community-deleted'

type CommunitiesDeleteOptions = ApiClientOptions & {
  json?: boolean
  yes?: boolean
}

export async function communitiesFeatureDelete(organizationId: string, options: CommunitiesDeleteOptions) {
  await coreUiConfirmDestructiveAction({
    message: `Delete community "${organizationId}"?`,
    yes: options.yes,
  })

  const apiClient = getApiClient(options)
  const result = await apiClient.organizationDelete({ organizationId })

  if (options.json) {
    coreUiJson(result)
    return
  }

  communitiesUiPrintCommunityDeleted(result.organizationId)
}

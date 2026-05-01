import { type AdminOrganization, type ApiClientOptions } from '../api/data-access/admin-api-client'
import { getApiClient } from '../api/data-access/get-api-client'
import { coreUiJson } from '../core/ui/core-ui-json'
import { communitiesUiPrintCommunity } from './ui/communities-ui-print-community'

type CommunitiesGetOptions = ApiClientOptions & {
  json?: boolean
}

function requireCommunity(community: AdminOrganization | null, organizationId: string): AdminOrganization {
  if (!community) {
    throw new Error(`Community "${organizationId}" was not found.`)
  }

  return community
}

export async function communitiesFeatureGet(organizationId: string, options: CommunitiesGetOptions) {
  const apiClient = getApiClient(options)
  const community = requireCommunity(await apiClient.organizationGet({ organizationId }), organizationId)

  if (options.json) {
    coreUiJson(community)
    return
  }

  communitiesUiPrintCommunity(community)
}

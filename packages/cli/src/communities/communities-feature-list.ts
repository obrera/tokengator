import { type AdminOrganizationListInput, type ApiClientOptions } from '../api/data-access/admin-api-client'
import { getApiClient } from '../api/data-access/get-api-client'
import { getOptionalNumber, getOptionalString, pickDefined } from '../api/util/command-options'
import { coreUiJson } from '../core/ui/core-ui-json'
import { communitiesUiPrintCommunityList } from './ui/communities-ui-print-community-list'

type CommunitiesListOptions = ApiClientOptions & {
  json?: boolean
  limit?: number
  offset?: number
  search?: string
}

export async function communitiesFeatureList(options: CommunitiesListOptions) {
  const apiClient = getApiClient(options)
  const input = pickDefined<AdminOrganizationListInput>({
    limit: getOptionalNumber(options.limit),
    offset: getOptionalNumber(options.offset),
    search: getOptionalString(options.search),
  })
  const result = await apiClient.organizationList(input)

  if (options.json) {
    coreUiJson(result)
    return
  }

  communitiesUiPrintCommunityList(result)
}

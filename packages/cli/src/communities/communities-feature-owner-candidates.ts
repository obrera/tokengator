import {
  type AdminOrganizationListOwnerCandidatesInput,
  type ApiClientOptions,
} from '../api/data-access/admin-api-client'
import { getApiClient } from '../api/data-access/get-api-client'
import { getOptionalNumber, getOptionalString, pickDefined } from '../api/util/command-options'
import { coreUiJson } from '../core/ui/core-ui-json'
import { communitiesUiPrintOwnerCandidates } from './ui/communities-ui-print-owner-candidates'

type CommunitiesOwnerCandidatesOptions = ApiClientOptions & {
  json?: boolean
  limit?: number
  search?: string
}

export async function communitiesFeatureOwnerCandidates(options: CommunitiesOwnerCandidatesOptions) {
  const apiClient = getApiClient(options)
  const input = pickDefined<AdminOrganizationListOwnerCandidatesInput>({
    limit: getOptionalNumber(options.limit),
    search: getOptionalString(options.search),
  })
  const candidates = await apiClient.organizationListOwnerCandidates(input)

  if (options.json) {
    coreUiJson(candidates)
    return
  }

  communitiesUiPrintOwnerCandidates(candidates)
}

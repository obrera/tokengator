import { type ApiClientOptions } from '../api/data-access/admin-api-client'
import { getApiClient } from '../api/data-access/get-api-client'
import { getOptionalString, pickDefined } from '../api/util/command-options'
import { coreUiJson } from '../core/ui/core-ui-json'
import { communitiesUiPrintCommunity } from './ui/communities-ui-print-community'

type CommunitiesCreateOptions = ApiClientOptions & {
  json?: boolean
  logo?: string
  name: string
  ownerUserId: string
  slug: string
}

export async function communitiesFeatureCreate(options: CommunitiesCreateOptions) {
  const apiClient = getApiClient(options)
  const community = await apiClient.organizationCreate({
    name: options.name,
    ownerUserId: options.ownerUserId,
    slug: options.slug,
    ...pickDefined({
      logo: getOptionalString(options.logo),
    }),
  })

  if (options.json) {
    coreUiJson(community)
    return
  }

  communitiesUiPrintCommunity(community)
}

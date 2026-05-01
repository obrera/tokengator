import { type AdminOrganizationAddMemberInput, type ApiClientOptions } from '../api/data-access/admin-api-client'
import { getApiClient } from '../api/data-access/get-api-client'
import { coreUiJson } from '../core/ui/core-ui-json'
import { communitiesUiPrintMember } from './ui/communities-ui-print-member'

type CommunitiesAddMemberOptions = ApiClientOptions & {
  json?: boolean
  role: AdminOrganizationAddMemberInput['role']
  userId: string
}

export async function communitiesFeatureMembersAdd(organizationId: string, options: CommunitiesAddMemberOptions) {
  const apiClient = getApiClient(options)
  const result = await apiClient.organizationAddMember({
    organizationId,
    role: options.role,
    userId: options.userId,
  })

  if (options.json) {
    coreUiJson(result)
    return
  }

  communitiesUiPrintMember(result)
}

import { type AdminCommunityRoleCreateInput, type ApiClientOptions } from '../api/data-access/admin-api-client'
import { getApiClient } from '../api/data-access/get-api-client'
import { coreUiJson } from '../core/ui/core-ui-json'
import { communityRolesUiPrintCommunityRole } from './ui/community-roles-ui-print-community-role'

type CommunityRolesCreateOptions = ApiClientOptions & {
  conditions: AdminCommunityRoleCreateInput['data']['conditions']
  disabled?: boolean
  json?: boolean
  matchMode: 'all' | 'any'
  name: string
  organizationId: string
  slug: string
}

export async function communityRolesFeatureCreate(options: CommunityRolesCreateOptions) {
  const apiClient = getApiClient(options)
  const communityRole = await apiClient.communityRoleCreate({
    data: {
      conditions: options.conditions,
      enabled: !options.disabled,
      matchMode: options.matchMode,
      name: options.name,
      slug: options.slug,
    },
    organizationId: options.organizationId,
  })

  if (options.json) {
    coreUiJson(communityRole)
    return
  }

  communityRolesUiPrintCommunityRole(communityRole)
}

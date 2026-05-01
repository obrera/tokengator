import type { AdminCommunityRole } from '../../api/data-access/admin-api-client'
import { coreUiKeyValues } from '../../core/ui/core-ui-key-values'

export function communityRolesUiPrintCommunityRole(communityRole: AdminCommunityRole) {
  coreUiKeyValues({
    enabled: communityRole.enabled,
    id: communityRole.id,
    matchMode: communityRole.matchMode,
    name: communityRole.name,
    organizationId: communityRole.organizationId,
    slug: communityRole.slug,
    teamId: communityRole.teamId,
  })
}

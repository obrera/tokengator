import type { AdminOrganizationAddMemberResult } from '../../api/data-access/admin-api-client'
import { coreUiKeyValues } from '../../core/ui/core-ui-key-values'

export function communitiesUiPrintMember(member: AdminOrganizationAddMemberResult) {
  coreUiKeyValues(member)
}

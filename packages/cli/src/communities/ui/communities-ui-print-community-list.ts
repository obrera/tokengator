import type { AdminOrganizationListResult } from '../../api/data-access/admin-api-client'
import { coreUiTable } from '../../core/ui/core-ui-table'
import { communitiesUiFormatOwners } from './communities-ui-format-owners'

export function communitiesUiPrintCommunityList(result: AdminOrganizationListResult) {
  coreUiTable(
    result.organizations,
    [
      {
        key: 'id',
        label: 'id',
        value: (community) => community.id,
      },
      {
        key: 'memberCount',
        label: 'memberCount',
        value: (community) => community.memberCount ?? 0,
      },
      {
        key: 'name',
        label: 'name',
        value: (community) => community.name,
      },
      {
        key: 'owners',
        label: 'owners',
        value: communitiesUiFormatOwners,
      },
      {
        key: 'slug',
        label: 'slug',
        value: (community) => community.slug,
      },
    ],
    'No communities found.',
  )
  console.log(`Total: ${result.total}`)
}

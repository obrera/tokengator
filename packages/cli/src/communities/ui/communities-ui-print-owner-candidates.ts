import type { AdminOrganizationOwnerCandidate } from '../../api/data-access/admin-api-client'

import { coreUiTable } from '../../core/ui/core-ui-table'

export function communitiesUiPrintOwnerCandidates(candidates: AdminOrganizationOwnerCandidate[]) {
  coreUiTable(
    candidates,
    [
      {
        key: 'id',
        label: 'id',
        value: (candidate) => candidate.id,
      },
      {
        key: 'name',
        label: 'name',
        value: (candidate) => candidate.name,
      },
      {
        key: 'username',
        label: 'username',
        value: (candidate) => candidate.username,
      },
    ],
    'No owner candidates found.',
  )
}

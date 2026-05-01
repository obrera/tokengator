import type { AdminOrganization } from '../../api/data-access/admin-api-client'

export function communitiesUiFormatOwners(community: AdminOrganization): string {
  return (community.owners ?? [])
    .map((owner) => owner.username ?? owner.name ?? owner.userId)
    .sort((left, right) => left.localeCompare(right))
    .join(', ')
}

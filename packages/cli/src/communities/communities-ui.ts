import type {
  AdminOrganization,
  AdminOrganizationListResult,
  AdminOrganizationOwnerCandidate,
} from '../api/data-access/admin-api-client'
import { formatOptionalDate, printKeyValues, printTable } from '../api/ui/api-output'

function formatOwners(community: AdminOrganization): string {
  return (community.owners ?? [])
    .map((owner) => owner.username ?? owner.name ?? owner.userId)
    .sort((left, right) => left.localeCompare(right))
    .join(', ')
}

export function communitiesUiPrintCommunity(community: AdminOrganization) {
  printKeyValues({
    createdAt: formatOptionalDate(community.createdAt),
    description: community.description,
    discordUrl: community.discordUrl,
    githubUrl: community.githubUrl,
    id: community.id,
    logo: community.logo,
    memberCount: community.memberCount,
    name: community.name,
    owners: formatOwners(community),
    slug: community.slug,
    telegramUrl: community.telegramUrl,
    websiteUrl: community.websiteUrl,
    xUrl: community.xUrl,
  })
}

export function communitiesUiPrintCommunityDeleted(organizationId: string) {
  console.log(`Deleted community "${organizationId}".`)
}

export function communitiesUiPrintCommunityList(result: AdminOrganizationListResult) {
  printTable(
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
        value: formatOwners,
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

export function communitiesUiPrintOwnerCandidates(candidates: AdminOrganizationOwnerCandidate[]) {
  printTable(
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

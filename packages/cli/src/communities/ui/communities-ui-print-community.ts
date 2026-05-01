import type { AdminOrganization } from '../../api/data-access/admin-api-client'
import { coreUiFormatOptionalDate } from '../../core/ui/core-ui-format-optional-date'
import { coreUiKeyValues } from '../../core/ui/core-ui-key-values'
import { communitiesUiFormatOwners } from './communities-ui-format-owners'

export function communitiesUiPrintCommunity(community: AdminOrganization) {
  coreUiKeyValues({
    createdAt: coreUiFormatOptionalDate(community.createdAt),
    description: community.description,
    discordUrl: community.discordUrl,
    githubUrl: community.githubUrl,
    id: community.id,
    logo: community.logo,
    memberCount: community.memberCount,
    name: community.name,
    owners: communitiesUiFormatOwners(community),
    slug: community.slug,
    telegramUrl: community.telegramUrl,
    websiteUrl: community.websiteUrl,
    xUrl: community.xUrl,
  })
}

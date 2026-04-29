import { profileCommunityAssetRolesList as profileCommunityAssetRolesListDataAccess } from '../../profile/data-access/profile-community-asset-roles-list'

import { communityGetBySlug as communityGetBySlugDataAccess } from './community-get-by-slug'
import { getCommunityRoleAssetMarketplace, getMarketplaceAvailability } from './community-marketplace'
import {
  toCommunityRoleAssetGroupEntity,
  type CommunityGetBySlugResult,
  type CommunityRoleAssetGroupEntity,
} from './community.entity'

function toCommunityAssignedRoleAssetGroup(input: {
  address: string
  id: string
  imageUrl: string | null
  label: string
  maximumAmount: string | null
  minimumAmount: string
  resolverKind: CommunityRoleAssetGroupEntity['resolverKind']
  symbolMagicEden: string | null
  type: CommunityRoleAssetGroupEntity['type']
}): CommunityRoleAssetGroupEntity {
  return toCommunityRoleAssetGroupEntity({
    address: input.address,
    id: input.id,
    imageUrl: input.imageUrl,
    label: input.label,
    maximumAmount: input.maximumAmount,
    minimumAmount: input.minimumAmount,
    resolverKind: input.resolverKind,
    symbolMagicEden: input.symbolMagicEden,
    type: input.type,
  })
}

export async function communityGetBySlugForUser(input: {
  slug: string
  userId: string
}): Promise<CommunityGetBySlugResult | null> {
  const community = await communityGetBySlugDataAccess(input.slug)

  if (!community) {
    return null
  }

  const assignedRolesByOrganizationId = await profileCommunityAssetRolesListDataAccess({
    organizationIds: [community.id],
    userId: input.userId,
  })
  const assignedRolesById = new Map(
    (assignedRolesByOrganizationId.get(community.id) ?? []).map((role) => [role.id, role]),
  )
  const marketplace = getMarketplaceAvailability()

  return {
    collections: community.collections,
    id: community.id,
    logo: community.logo,
    marketplace,
    name: community.name,
    roles: community.roles.map((role) => {
      const assignedRole = assignedRolesById.get(role.id)
      const assetGroupsById = new Map(role.assetGroups.map((assetGroup) => [assetGroup.id, assetGroup]))
      const assigned = Boolean(assignedRole)

      return {
        assetGroups: role.assetGroups,
        assetMarketplace: getCommunityRoleAssetMarketplace({
          assigned,
          magicEdenAvailability: marketplace.magicEden,
          role,
        }),
        assigned,
        assignedAssetGroups:
          assignedRole?.assetGroups.map((assetGroup) =>
            toCommunityAssignedRoleAssetGroup({
              ...assetGroup,
              symbolMagicEden: assetGroupsById.get(assetGroup.id)?.symbolMagicEden ?? null,
            }),
          ) ?? [],
        id: role.id,
        matchMode: role.matchMode,
        name: role.name,
        slug: role.slug,
      }
    }),
    slug: community.slug,
  } satisfies CommunityGetBySlugResult
}

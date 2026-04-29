import { ORPCError } from '@orpc/server'

import { protectedProcedure } from '../../../lib/procedures'
import { profileCommunityAssetRolesList as profileCommunityAssetRolesListDataAccess } from '../../profile/data-access/profile-community-asset-roles-list'

import { communityGetBySlug as communityGetBySlugDataAccess } from '../data-access/community-get-by-slug'
import { communitySlugInputSchema } from '../data-access/community-slug-input-schema'
import { toCommunityRoleAssetGroupEntity, type CommunityRoleAssetGroupEntity } from '../data-access/community.entity'

function toCommunityAssignedRoleAssetGroup(input: {
  address: string
  id: string
  imageUrl: string | null
  label: string
  maximumAmount: string | null
  minimumAmount: string
  resolverKind: CommunityRoleAssetGroupEntity['resolverKind']
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
    type: input.type,
  })
}

export const communityFeatureGetBySlug = protectedProcedure
  .input(communitySlugInputSchema)
  .handler(async ({ context, input }) => {
    const community = await communityGetBySlugDataAccess(input.slug)

    if (!community) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Community not found.',
      })
    }

    const assignedRolesByOrganizationId = await profileCommunityAssetRolesListDataAccess({
      organizationIds: [community.id],
      userId: context.session.user.id,
    })
    const assignedRolesById = new Map(
      (assignedRolesByOrganizationId.get(community.id) ?? []).map((role) => [role.id, role]),
    )

    return {
      collections: community.collections,
      id: community.id,
      logo: community.logo,
      name: community.name,
      roles: community.roles.map((role) => {
        const assignedRole = assignedRolesById.get(role.id)

        return {
          assetGroups: role.assetGroups,
          assigned: Boolean(assignedRole),
          assignedAssetGroups: assignedRole?.assetGroups.map(toCommunityAssignedRoleAssetGroup) ?? [],
          id: role.id,
          matchMode: role.matchMode,
          name: role.name,
          slug: role.slug,
        }
      }),
      slug: community.slug,
    }
  })

import { eq, inArray } from 'drizzle-orm'
import { db } from '@tokengator/db'
import { assetGroup } from '@tokengator/db/schema/asset'
import { organization } from '@tokengator/db/schema/auth'

import { listCommunityRoleRecords } from '../../../features/community-role-sync'
import { getAssetGroupImageUrl } from '../../../lib/asset-group-image-url'
import { parseStoredJsonOrValue } from '../../../lib/stored-json'

import {
  communityEntityColumns,
  type CommunityCollectionFacetTotals,
  toCommunityCollectionEntity,
  toCommunityDetailEntity,
  toCommunityEntity,
  toCommunityRoleAssetGroupEntity,
  toCommunityRoleEntity,
} from './community.entity'

function compareCommunityCollections(
  left: ReturnType<typeof toCommunityCollectionEntity>,
  right: ReturnType<typeof toCommunityCollectionEntity>,
) {
  return (
    left.label.localeCompare(right.label) ||
    left.address.localeCompare(right.address) ||
    left.id.localeCompare(right.id)
  )
}

function compareCommunityRoleAssetGroups(
  left: ReturnType<typeof toCommunityRoleAssetGroupEntity>,
  right: ReturnType<typeof toCommunityRoleAssetGroupEntity>,
) {
  return (
    left.label.localeCompare(right.label) ||
    left.address.localeCompare(right.address) ||
    left.id.localeCompare(right.id)
  )
}

function compareCommunityRoles(
  left: ReturnType<typeof toCommunityRoleEntity>,
  right: ReturnType<typeof toCommunityRoleEntity>,
) {
  return left.name.localeCompare(right.name) || left.slug.localeCompare(right.slug) || left.id.localeCompare(right.id)
}

function getUniqueSortedAssetGroupIds(communityRoles: ReturnType<typeof toCommunityRoleEntity>[]) {
  return [
    ...new Set(communityRoles.flatMap((communityRole) => communityRole.assetGroups.map((assetGroup) => assetGroup.id))),
  ].sort((left, right) => left.localeCompare(right))
}

export async function communityGetBySlug(slug: string) {
  const [communityRecord] = await db
    .select(communityEntityColumns)
    .from(organization)
    .where(eq(organization.slug, slug))
    .limit(1)

  if (!communityRecord) {
    return null
  }

  const collectionsById = new Map<string, ReturnType<typeof toCommunityCollectionEntity>>()
  const facetTotalsByCollectionId = new Map<string, CommunityCollectionFacetTotals>()
  const communityRoles = await listCommunityRoleRecords(communityRecord.id)
  const roles = communityRoles
    .filter((communityRole) => communityRole.enabled)
    .map((communityRole) =>
      toCommunityRoleEntity({
        assetGroups: communityRole.conditions
          .filter((condition) => condition.assetGroupEnabled)
          .map((condition) =>
            toCommunityRoleAssetGroupEntity({
              address: condition.assetGroupAddress,
              id: condition.assetGroupId,
              imageUrl: null,
              label: condition.assetGroupLabel,
              maximumAmount: condition.maximumAmount,
              minimumAmount: condition.minimumAmount,
              resolverKind: condition.assetGroupResolverKind,
              type: condition.assetGroupType,
            }),
          )
          .sort(compareCommunityRoleAssetGroups),
        assigned: false,
        assignedAssetGroups: [],
        id: communityRole.id,
        matchMode: communityRole.matchMode,
        name: communityRole.name,
        slug: communityRole.slug,
      }),
    )
    .filter((communityRole) => communityRole.assetGroups.length > 0)
    .sort(compareCommunityRoles)
  const assetGroupIds = getUniqueSortedAssetGroupIds(roles)
  const assetGroupDetailsById = new Map<
    string,
    {
      facetTotals: CommunityCollectionFacetTotals
      imageUrl: string | null
    }
  >()

  if (assetGroupIds.length > 0) {
    const assetGroupRows = await db
      .select({
        facetTotals: assetGroup.facetTotals,
        id: assetGroup.id,
        imageUrl: assetGroup.imageUrl,
      })
      .from(assetGroup)
      .where(inArray(assetGroup.id, assetGroupIds))

    for (const assetGroupRow of assetGroupRows) {
      const parsedFacetTotals = parseStoredJsonOrValue(assetGroupRow.facetTotals)

      assetGroupDetailsById.set(assetGroupRow.id, {
        facetTotals:
          parsedFacetTotals && typeof parsedFacetTotals === 'object' && !Array.isArray(parsedFacetTotals)
            ? (parsedFacetTotals as CommunityCollectionFacetTotals)
            : {},
        imageUrl: assetGroupRow.imageUrl,
      })
    }
  }

  for (const role of roles) {
    for (const roleAssetGroup of role.assetGroups) {
      const assetGroupDetails = assetGroupDetailsById.get(roleAssetGroup.id)

      roleAssetGroup.imageUrl = getAssetGroupImageUrl({
        id: roleAssetGroup.id,
        imageUrl: assetGroupDetails?.imageUrl ?? null,
      })

      if (roleAssetGroup.type !== 'collection' || collectionsById.has(roleAssetGroup.id)) {
        continue
      }

      collectionsById.set(
        roleAssetGroup.id,
        toCommunityCollectionEntity({
          address: roleAssetGroup.address,
          facetTotals: assetGroupDetails?.facetTotals ?? {},
          id: roleAssetGroup.id,
          imageUrl: roleAssetGroup.imageUrl,
          label: roleAssetGroup.label,
          type: roleAssetGroup.type,
        }),
      )
    }
  }

  for (const [assetGroupId, assetGroupDetails] of assetGroupDetailsById) {
    facetTotalsByCollectionId.set(assetGroupId, assetGroupDetails.facetTotals)
  }

  return toCommunityDetailEntity({
    collections: [...collectionsById.values()]
      .map((collection) => ({
        ...collection,
        facetTotals: facetTotalsByCollectionId.get(collection.id) ?? {},
      }))
      .sort(compareCommunityCollections),
    community: toCommunityEntity(communityRecord),
    roles,
  })
}

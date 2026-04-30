import { eq, sql } from 'drizzle-orm'
import { db } from '@tokengator/db'
import { asset } from '@tokengator/db/schema/asset'

import { communityGetBySlug } from './community-get-by-slug'

import type {
  CommunityCollectionInsightsTraitGroupEntity,
  CommunityCollectionInsightsTraitOptionEntity,
  CommunityGetCollectionInsightsResult,
} from './community.entity'

function compareCommunityCollectionInsightTraitGroups(
  left: CommunityCollectionInsightsTraitGroupEntity,
  right: CommunityCollectionInsightsTraitGroupEntity,
) {
  return right.total - left.total || left.label.localeCompare(right.label) || left.groupId.localeCompare(right.groupId)
}

function compareCommunityCollectionInsightTraitOptions(
  left: CommunityCollectionInsightsTraitOptionEntity,
  right: CommunityCollectionInsightsTraitOptionEntity,
) {
  return right.total - left.total || left.label.localeCompare(right.label) || left.value.localeCompare(right.value)
}

export async function communityGetCollectionInsights(input: {
  address: string
  slug: string
}): Promise<CommunityGetCollectionInsightsResult | null> {
  const community = await communityGetBySlug(input.slug)

  if (!community) {
    return null
  }

  const collection = community.collections.find((currentCollection) => currentCollection.address === input.address)

  if (!collection) {
    return null
  }

  const [assetTotalRow] = await db
    .select({
      total: sql<number>`cast(count(${asset.id}) as integer)`,
    })
    .from(asset)
    .where(eq(asset.assetGroupId, collection.id))
  const traitGroups: CommunityCollectionInsightsTraitGroupEntity[] = Object.entries(collection.facetTotals)
    .map(([groupId, group]) => ({
      groupId,
      label: group.label || groupId,
      options: Object.entries(group.options)
        .map(
          ([value, option]): CommunityCollectionInsightsTraitOptionEntity => ({
            label: option.label,
            total: option.total,
            value,
          }),
        )
        .sort(compareCommunityCollectionInsightTraitOptions),
      total: group.total,
    }))
    .sort(compareCommunityCollectionInsightTraitGroups)

  return {
    assetTotal: assetTotalRow?.total ?? 0,
    traitGroups,
  }
}

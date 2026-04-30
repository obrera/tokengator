import { asc, eq, sql } from 'drizzle-orm'
import { db } from '@tokengator/db'
import { asset, assetTrait } from '@tokengator/db/schema/asset'

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
  const traitGroupRows = await db
    .select({
      groupId: assetTrait.traitKey,
      label: sql<string>`min(${assetTrait.traitLabel})`,
      total: sql<number>`cast(count(distinct ${assetTrait.assetId}) as integer)`,
    })
    .from(assetTrait)
    .where(eq(assetTrait.assetGroupId, collection.id))
    .groupBy(assetTrait.traitKey)
    .orderBy(asc(assetTrait.traitKey))
  const traitOptionRows = await db
    .select({
      groupId: assetTrait.traitKey,
      label: sql<string>`min(${assetTrait.traitLabel})`,
      total: sql<number>`cast(count(distinct ${assetTrait.assetId}) as integer)`,
      value: assetTrait.traitValue,
      valueLabel: sql<string>`min(${assetTrait.traitValueLabel})`,
    })
    .from(assetTrait)
    .where(eq(assetTrait.assetGroupId, collection.id))
    .groupBy(assetTrait.traitKey, assetTrait.traitValue)
    .orderBy(asc(assetTrait.traitKey), asc(assetTrait.traitValue))
  const traitOptionsByGroupId = new Map<string, CommunityCollectionInsightsTraitOptionEntity[]>()

  for (const traitOptionRow of traitOptionRows) {
    const currentOptions = traitOptionsByGroupId.get(traitOptionRow.groupId) ?? []

    currentOptions.push({
      label: traitOptionRow.valueLabel,
      total: traitOptionRow.total,
      value: traitOptionRow.value,
    })
    traitOptionsByGroupId.set(traitOptionRow.groupId, currentOptions)
  }

  const traitGroups: CommunityCollectionInsightsTraitGroupEntity[] = traitGroupRows
    .map((traitGroupRow) => ({
      groupId: traitGroupRow.groupId,
      label: traitGroupRow.label || traitGroupRow.groupId,
      options: (traitOptionsByGroupId.get(traitGroupRow.groupId) ?? []).sort(
        compareCommunityCollectionInsightTraitOptions,
      ),
      total: traitGroupRow.total,
    }))
    .sort(compareCommunityCollectionInsightTraitGroups)

  return {
    assetTotal: assetTotalRow?.total ?? 0,
    traitGroups,
  }
}

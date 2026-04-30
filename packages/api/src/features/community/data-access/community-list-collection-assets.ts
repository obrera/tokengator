import { and, asc, eq, exists, inArray, isNotNull, or, sql, type SQL } from 'drizzle-orm'
import { db } from '@tokengator/db'
import { asset, assetTraitGroup, assetTraitMembership, assetTraitValue } from '@tokengator/db/schema/asset'
import { solanaWallet, user } from '@tokengator/db/schema/auth'

import { getSqliteChunkSize, splitIntoChunks } from '../../../lib/sqlite'

import { communityGetBySlug } from './community-get-by-slug'
import {
  communityCollectionAssetEntityColumns,
  parseStoredAssetTraits,
  toCommunityCollectionAssetEntity,
  toCommunityListCollectionAssetsResult,
  type CommunityCollectionFacetTotals,
} from './community.entity'

import type { CommunityListCollectionAssetsResult } from './community.entity'

function createCommunityCollectionMetadataSearchPattern(value?: string) {
  const trimmedValue = value?.trim()

  if (!trimmedValue) {
    return null
  }

  const escapedValue = trimmedValue.toLowerCase().replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_')

  return `%${escapedValue}%`
}

function normalizeCommunityCollectionSearchTerm(value?: string) {
  const trimmedValue = value?.trim()

  return trimmedValue ? trimmedValue : null
}

function createCommunityCollectionUsernameSearchPattern(value?: string) {
  const trimmedValue = value?.trim()

  if (!trimmedValue) {
    return null
  }

  const escapedValue = trimmedValue.toLowerCase().replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_')

  return `%${escapedValue}%`
}

function createEmptyCommunityCollectionFacetTotals(
  facetTotals: CommunityCollectionFacetTotals,
): CommunityCollectionFacetTotals {
  return Object.fromEntries(
    Object.entries(facetTotals)
      .sort(([leftGroupId], [rightGroupId]) => leftGroupId.localeCompare(rightGroupId))
      .map(([groupId, group]) => [
        groupId,
        {
          label: group.label,
          options: Object.fromEntries(
            Object.entries(group.options)
              .sort(([leftValue], [rightValue]) => leftValue.localeCompare(rightValue))
              .map(([value, option]) => [
                value,
                {
                  label: option.label,
                  total: 0,
                },
              ]),
          ),
          total: 0,
        },
      ]),
  )
}

function sortCommunityCollectionFacetTotals(
  facetTotals: CommunityCollectionFacetTotals,
): CommunityCollectionFacetTotals {
  return Object.fromEntries(
    Object.entries(facetTotals)
      .sort(([leftGroupId], [rightGroupId]) => leftGroupId.localeCompare(rightGroupId))
      .map(([groupId, group]) => [
        groupId,
        {
          label: group.label,
          options: Object.fromEntries(
            Object.entries(group.options)
              .sort(([leftValue], [rightValue]) => leftValue.localeCompare(rightValue))
              .map(([value, option]) => [value, option]),
          ),
          total: group.total,
        },
      ]),
  )
}

async function resolveCommunityCollectionFacetValueFilters(input: {
  collectionId: string
  facets?: Record<string, string[]>
}) {
  const facetEntries = Object.entries(input.facets ?? {})
    .map(
      ([groupId, values]) => [groupId, [...new Set(values)].sort((left, right) => left.localeCompare(right))] as const,
    )
    .sort(([leftGroupId], [rightGroupId]) => leftGroupId.localeCompare(rightGroupId))
  const valueIdsByGroupId = new Map<string, string[]>()

  if (facetEntries.length === 0) {
    return valueIdsByGroupId
  }

  const groupIds = facetEntries.map(([groupId]) => groupId)
  const values = [...new Set(facetEntries.flatMap(([, groupValues]) => groupValues))].sort((left, right) =>
    left.localeCompare(right),
  )

  if (values.length === 0) {
    for (const [groupId] of facetEntries) {
      valueIdsByGroupId.set(groupId, [])
    }

    return valueIdsByGroupId
  }

  const facetValueRows = []

  for (const groupIdChunk of splitIntoChunks(groupIds, getSqliteChunkSize(2))) {
    const valueChunkSize = Math.max(1, getSqliteChunkSize(1) - groupIdChunk.length - 1)

    for (const valueChunk of splitIntoChunks(values, valueChunkSize)) {
      facetValueRows.push(
        ...(await db
          .select({
            groupId: assetTraitGroup.value,
            id: assetTraitValue.id,
            value: assetTraitValue.value,
          })
          .from(assetTraitGroup)
          .innerJoin(assetTraitValue, eq(assetTraitValue.groupId, assetTraitGroup.id))
          .where(
            and(
              eq(assetTraitGroup.assetGroupId, input.collectionId),
              inArray(assetTraitGroup.value, groupIdChunk),
              inArray(assetTraitValue.value, valueChunk),
            ),
          )),
      )
    }
  }

  const facetValueIdByGroupValue = new Map(
    facetValueRows.map((facetValueRow) => [
      JSON.stringify([facetValueRow.groupId, facetValueRow.value]),
      facetValueRow.id,
    ]),
  )

  for (const [groupId, groupValues] of facetEntries) {
    const valueIds = groupValues.map((value) => facetValueIdByGroupValue.get(JSON.stringify([groupId, value])))
    const resolvedValueIds = valueIds.filter((valueId): valueId is string => Boolean(valueId))

    valueIdsByGroupId.set(groupId, resolvedValueIds.length === valueIds.length ? resolvedValueIds : [])
  }

  return valueIdsByGroupId
}

function getCommunityCollectionAssetFilters(input: {
  collectionId: string
  excludedFacetGroupId?: string
  facetValueIdsByGroupId: Map<string, string[]>
  metadataQueryPattern: string | null
  ownerSearchTerm: string | null
  ownerUsernameSearchPattern: string | null
  querySearchTerm: string | null
}): SQL<unknown>[] {
  const filters: SQL<unknown>[] = [eq(asset.assetGroupId, input.collectionId)]

  for (const [groupId, valueIds] of [...input.facetValueIdsByGroupId.entries()].sort(([leftGroupId], [rightGroupId]) =>
    leftGroupId.localeCompare(rightGroupId),
  )) {
    if (groupId === input.excludedFacetGroupId) {
      continue
    }

    if (valueIds.length === 0) {
      filters.push(sql`0 = 1`)
      continue
    }

    filters.push(
      exists(
        db
          .select({
            valueId: assetTraitMembership.valueId,
          })
          .from(assetTraitMembership)
          .where(
            and(
              eq(assetTraitMembership.assetGroupId, input.collectionId),
              eq(assetTraitMembership.assetId, asset.id),
              inArray(assetTraitMembership.valueId, valueIds),
            ),
          ),
      ),
    )
  }

  if (input.ownerSearchTerm || input.ownerUsernameSearchPattern) {
    filters.push(
      or(
        input.ownerSearchTerm ? sql`instr(trim(${asset.owner}), ${input.ownerSearchTerm}) > 0` : undefined,
        input.ownerUsernameSearchPattern
          ? exists(
              db
                .select({
                  id: solanaWallet.id,
                })
                .from(solanaWallet)
                .innerJoin(user, eq(user.id, solanaWallet.userId))
                .where(
                  and(
                    eq(solanaWallet.address, asset.owner),
                    isNotNull(user.username),
                    sql`lower(${user.username}) like ${input.ownerUsernameSearchPattern} escape '\\'`,
                  ),
                ),
            )
          : undefined,
      )!,
    )
  }

  if (input.metadataQueryPattern || input.querySearchTerm) {
    filters.push(
      or(
        input.querySearchTerm ? sql`instr(trim(${asset.address}), ${input.querySearchTerm}) > 0` : undefined,
        input.metadataQueryPattern
          ? sql`coalesce(lower(${asset.metadataName}), '') like ${input.metadataQueryPattern} escape '\\'`
          : undefined,
      )!,
    )
  }

  return filters
}

async function getCommunityCollectionFacetTotals(input: {
  collectionId: string
  facetValueIdsByGroupId: Map<string, string[]>
  facetTotals: CommunityCollectionFacetTotals
  metadataQueryPattern: string | null
  ownerSearchTerm: string | null
  ownerUsernameSearchPattern: string | null
  querySearchTerm: string | null
}): Promise<CommunityCollectionFacetTotals> {
  const nextFacetTotals = createEmptyCommunityCollectionFacetTotals(input.facetTotals)
  const facetGroupRows = await db
    .select({
      traitKey: assetTraitGroup.value,
    })
    .from(assetTraitGroup)
    .where(eq(assetTraitGroup.assetGroupId, input.collectionId))
    .groupBy(assetTraitGroup.value)
    .orderBy(asc(assetTraitGroup.value))
  const facetGroupIds = [
    ...new Set([...Object.keys(input.facetTotals), ...facetGroupRows.map((row) => row.traitKey)]),
  ].sort()

  for (const facetGroupId of facetGroupIds) {
    const filters = getCommunityCollectionAssetFilters({
      collectionId: input.collectionId,
      excludedFacetGroupId: facetGroupId,
      facetValueIdsByGroupId: input.facetValueIdsByGroupId,
      metadataQueryPattern: input.metadataQueryPattern,
      ownerSearchTerm: input.ownerSearchTerm,
      ownerUsernameSearchPattern: input.ownerUsernameSearchPattern,
      querySearchTerm: input.querySearchTerm,
    })
    const [facetGroupCountRow] = await db
      .select({
        label: assetTraitGroup.label,
        total: sql<number>`cast(count(distinct ${asset.id}) as integer)`,
      })
      .from(asset)
      .innerJoin(assetTraitMembership, eq(assetTraitMembership.assetId, asset.id))
      .innerJoin(assetTraitValue, eq(assetTraitValue.id, assetTraitMembership.valueId))
      .innerJoin(assetTraitGroup, eq(assetTraitGroup.id, assetTraitValue.groupId))
      .where(
        and(
          ...filters,
          eq(assetTraitMembership.assetGroupId, input.collectionId),
          eq(assetTraitGroup.value, facetGroupId),
        ),
      )
      .groupBy(assetTraitGroup.id, assetTraitGroup.label)
    const facetOptionRows = await db
      .select({
        label: assetTraitGroup.label,
        total: sql<number>`cast(count(distinct ${asset.id}) as integer)`,
        value: assetTraitValue.value,
        valueLabel: assetTraitValue.label,
      })
      .from(asset)
      .innerJoin(assetTraitMembership, eq(assetTraitMembership.assetId, asset.id))
      .innerJoin(assetTraitValue, eq(assetTraitValue.id, assetTraitMembership.valueId))
      .innerJoin(assetTraitGroup, eq(assetTraitGroup.id, assetTraitValue.groupId))
      .where(
        and(
          ...filters,
          eq(assetTraitMembership.assetGroupId, input.collectionId),
          eq(assetTraitGroup.value, facetGroupId),
        ),
      )
      .groupBy(
        assetTraitGroup.id,
        assetTraitGroup.label,
        assetTraitValue.id,
        assetTraitValue.value,
        assetTraitValue.label,
      )
      .orderBy(asc(assetTraitValue.value))

    if (!facetGroupCountRow?.label && facetOptionRows.length === 0 && !nextFacetTotals[facetGroupId]) {
      continue
    }

    const currentGroup = nextFacetTotals[facetGroupId] ?? {
      label: facetGroupCountRow?.label ?? facetOptionRows[0]?.label ?? facetGroupId,
      options: {},
      total: 0,
    }

    currentGroup.label = currentGroup.label || facetGroupCountRow?.label || facetOptionRows[0]?.label || facetGroupId
    currentGroup.total = facetGroupCountRow?.total ?? 0

    for (const facetOptionRow of facetOptionRows) {
      currentGroup.options[facetOptionRow.value] = {
        label: currentGroup.options[facetOptionRow.value]?.label ?? facetOptionRow.valueLabel,
        total: facetOptionRow.total,
      }
    }

    nextFacetTotals[facetGroupId] = currentGroup
  }

  return sortCommunityCollectionFacetTotals(nextFacetTotals)
}

export async function communityListCollectionAssets(input: {
  address: string
  facets?: Record<string, string[]>
  owner?: string
  query?: string
  slug: string
}): Promise<CommunityListCollectionAssetsResult | null> {
  const community = await communityGetBySlug(input.slug)

  if (!community) {
    return null
  }

  const collection = community.collections.find((currentCollection) => currentCollection.address === input.address)

  if (!collection) {
    return null
  }

  const metadataQueryPattern = createCommunityCollectionMetadataSearchPattern(input.query)
  const ownerSearchTerm = normalizeCommunityCollectionSearchTerm(input.owner)
  const ownerUsernameSearchPattern = createCommunityCollectionUsernameSearchPattern(input.owner)
  const querySearchTerm = normalizeCommunityCollectionSearchTerm(input.query)
  const visibleLabelExpression = sql<string>`coalesce(nullif(lower(${asset.metadataName}), ''), ${asset.address})`
  const facetValueIdsByGroupId = await resolveCommunityCollectionFacetValueFilters({
    collectionId: collection.id,
    facets: input.facets,
  })
  const filters = getCommunityCollectionAssetFilters({
    collectionId: collection.id,
    facetValueIdsByGroupId,
    metadataQueryPattern,
    ownerSearchTerm,
    ownerUsernameSearchPattern,
    querySearchTerm,
  })

  const assets = await db
    .select(communityCollectionAssetEntityColumns)
    .from(asset)
    .where(and(...filters))
    .orderBy(asc(visibleLabelExpression), asc(asset.owner), asc(asset.address), asc(asset.id))
  const shouldRecomputeFacetTotals =
    facetValueIdsByGroupId.size > 0 ||
    Boolean(metadataQueryPattern) ||
    Boolean(ownerSearchTerm) ||
    Boolean(ownerUsernameSearchPattern) ||
    Boolean(querySearchTerm)
  const facetTotals = shouldRecomputeFacetTotals
    ? await getCommunityCollectionFacetTotals({
        collectionId: collection.id,
        facetTotals: collection.facetTotals,
        facetValueIdsByGroupId,
        metadataQueryPattern,
        ownerSearchTerm,
        ownerUsernameSearchPattern,
        querySearchTerm,
      })
    : collection.facetTotals

  return toCommunityListCollectionAssetsResult({
    assets: assets.map((currentAsset) =>
      toCommunityCollectionAssetEntity({
        ...currentAsset,
        traits: parseStoredAssetTraits(currentAsset.traits),
      }),
    ),
    facetTotals,
  })
}

import { and, asc, eq, inArray, sql } from 'drizzle-orm'
import { db } from '@tokengator/db'
import { asset } from '@tokengator/db/schema/asset'
import { solanaWallet, user } from '@tokengator/db/schema/auth'

import { getSqliteChunkSize, splitIntoChunks } from '../../../lib/sqlite'

import { communityGetBySlug } from './community-get-by-slug'

import type {
  CommunityCollectionLeaderboardAssetEntity,
  CommunityCollectionLeaderboardHolderEntity,
  CommunityCollectionLeaderboardUserEntity,
  CommunityCollectionLeaderboardWalletEntity,
  CommunityListCollectionLeaderboardResult,
} from './community.entity'

const DEFAULT_COMMUNITY_COLLECTION_LEADERBOARD_LIMIT = 100
const MAX_COMMUNITY_COLLECTION_LEADERBOARD_LIMIT = 1000

type LeaderboardWalletAccumulator = Omit<CommunityCollectionLeaderboardWalletEntity, 'assets'>

type HolderAccumulator = {
  assetTotal: number
  displayName: string
  holderId: string
  kind: 'user' | 'wallet'
  sortLabel: string
  user: CommunityCollectionLeaderboardUserEntity | null
  wallets: LeaderboardWalletAccumulator[]
}

function compareCommunityCollectionLeaderboardHolders(left: HolderAccumulator, right: HolderAccumulator) {
  return (
    right.assetTotal - left.assetTotal ||
    left.sortLabel.localeCompare(right.sortLabel) ||
    left.holderId.localeCompare(right.holderId)
  )
}

function compareCommunityCollectionLeaderboardWallets(
  left: LeaderboardWalletAccumulator,
  right: LeaderboardWalletAccumulator,
) {
  return right.assetTotal - left.assetTotal || left.address.localeCompare(right.address)
}

function compareCommunityCollectionLeaderboardAssets(
  left: CommunityCollectionLeaderboardAssetEntity,
  right: CommunityCollectionLeaderboardAssetEntity,
) {
  const leftLabel = left.metadataName?.trim() || left.address
  const rightLabel = right.metadataName?.trim() || right.address

  return (
    leftLabel.localeCompare(rightLabel) || left.address.localeCompare(right.address) || left.id.localeCompare(right.id)
  )
}

function getCommunityCollectionLeaderboardLimit(limit?: number) {
  return Math.max(
    1,
    Math.min(limit ?? DEFAULT_COMMUNITY_COLLECTION_LEADERBOARD_LIMIT, MAX_COMMUNITY_COLLECTION_LEADERBOARD_LIMIT),
  )
}

function getCommunityCollectionLeaderboardUserDisplayName(user: CommunityCollectionLeaderboardUserEntity) {
  return user.username ? `@${user.username}` : user.name
}

function getCommunityCollectionLeaderboardUserSortLabel(user: CommunityCollectionLeaderboardUserEntity) {
  return user.username ?? user.name
}

async function getCommunityCollectionLeaderboardAssetsByOwner(input: {
  collectionId: string
  ownerAddresses: string[]
}) {
  const assetsByOwner = new Map<string, CommunityCollectionLeaderboardAssetEntity[]>()

  for (const ownerAddressChunk of splitIntoChunks(input.ownerAddresses, getSqliteChunkSize(1))) {
    if (ownerAddressChunk.length === 0) {
      continue
    }

    const assetRows = await db
      .select({
        address: asset.address,
        id: asset.id,
        metadataImageUrl: asset.metadataImageUrl,
        metadataName: asset.metadataName,
        metadataSymbol: asset.metadataSymbol,
        owner: asset.owner,
      })
      .from(asset)
      .where(and(eq(asset.assetGroupId, input.collectionId), inArray(asset.owner, ownerAddressChunk)))
      .orderBy(asc(asset.owner), asc(asset.metadataName), asc(asset.address), asc(asset.id))

    for (const assetRow of assetRows) {
      const currentAssets = assetsByOwner.get(assetRow.owner) ?? []

      currentAssets.push({
        address: assetRow.address,
        id: assetRow.id,
        metadataImageUrl: assetRow.metadataImageUrl,
        metadataName: assetRow.metadataName,
        metadataSymbol: assetRow.metadataSymbol,
      })
      assetsByOwner.set(assetRow.owner, currentAssets)
    }
  }

  for (const currentAssets of assetsByOwner.values()) {
    currentAssets.sort(compareCommunityCollectionLeaderboardAssets)
  }

  return assetsByOwner
}

export async function communityListCollectionLeaderboard(input: {
  address: string
  limit?: number
  slug: string
}): Promise<CommunityListCollectionLeaderboardResult | null> {
  const community = await communityGetBySlug(input.slug)

  if (!community) {
    return null
  }

  const collection = community.collections.find((currentCollection) => currentCollection.address === input.address)

  if (!collection) {
    return null
  }

  const ownerRows = await db
    .select({
      address: asset.owner,
      assetTotal: sql<number>`cast(count(${asset.id}) as integer)`,
    })
    .from(asset)
    .where(eq(asset.assetGroupId, collection.id))
    .groupBy(asset.owner)
    .orderBy(asc(asset.owner))
  const ownerAddresses = ownerRows.map((ownerRow) => ownerRow.address)
  const walletRows: Array<{
    address: string
    id: string
    name: string | null
    userId: string
  }> = []

  for (const ownerAddressChunk of splitIntoChunks(ownerAddresses, getSqliteChunkSize(1))) {
    if (ownerAddressChunk.length === 0) {
      continue
    }

    walletRows.push(
      ...(await db
        .select({
          address: solanaWallet.address,
          id: solanaWallet.id,
          name: solanaWallet.name,
          userId: solanaWallet.userId,
        })
        .from(solanaWallet)
        .where(inArray(solanaWallet.address, ownerAddressChunk))
        .orderBy(asc(solanaWallet.address), asc(solanaWallet.id))),
    )
  }

  const userIds = [...new Set(walletRows.map((walletRow) => walletRow.userId))].sort()
  const userRows: CommunityCollectionLeaderboardUserEntity[] = []

  for (const userIdChunk of splitIntoChunks(userIds, getSqliteChunkSize(1))) {
    if (userIdChunk.length === 0) {
      continue
    }

    userRows.push(
      ...(await db
        .select({
          id: user.id,
          image: user.image,
          name: user.name,
          username: user.username,
        })
        .from(user)
        .where(inArray(user.id, userIdChunk))
        .orderBy(asc(user.username), asc(user.name), asc(user.id))),
    )
  }

  const holdersById = new Map<string, HolderAccumulator>()
  const usersById = new Map(userRows.map((userRow) => [userRow.id, userRow]))
  const walletsByAddress = new Map(walletRows.map((walletRow) => [walletRow.address, walletRow]))

  for (const ownerRow of ownerRows) {
    const linkedWallet = walletsByAddress.get(ownerRow.address) ?? null
    const linkedUser = linkedWallet ? (usersById.get(linkedWallet.userId) ?? null) : null
    const holderId = linkedUser ? `user:${linkedUser.id}` : `wallet:${ownerRow.address}`
    const existingHolder = holdersById.get(holderId)
    const wallet: LeaderboardWalletAccumulator = {
      address: ownerRow.address,
      assetTotal: ownerRow.assetTotal,
      id: linkedWallet?.id ?? null,
      name: linkedWallet?.name ?? null,
    }

    if (existingHolder) {
      existingHolder.assetTotal += ownerRow.assetTotal
      existingHolder.wallets.push(wallet)
      continue
    }

    holdersById.set(holderId, {
      assetTotal: ownerRow.assetTotal,
      displayName: linkedUser ? getCommunityCollectionLeaderboardUserDisplayName(linkedUser) : ownerRow.address,
      holderId,
      kind: linkedUser ? 'user' : 'wallet',
      sortLabel: linkedUser ? getCommunityCollectionLeaderboardUserSortLabel(linkedUser) : ownerRow.address,
      user: linkedUser,
      wallets: [wallet],
    })
  }

  const rankedHolders = [...holdersById.values()]
    .map((holder) => ({
      ...holder,
      wallets: holder.wallets.sort(compareCommunityCollectionLeaderboardWallets),
    }))
    .sort(compareCommunityCollectionLeaderboardHolders)
    .slice(0, getCommunityCollectionLeaderboardLimit(input.limit))
  const rankedHolderOwnerAddresses = [
    ...new Set(rankedHolders.flatMap((holder) => holder.wallets.map((wallet) => wallet.address))),
  ].sort()
  const assetsByOwner = await getCommunityCollectionLeaderboardAssetsByOwner({
    collectionId: collection.id,
    ownerAddresses: rankedHolderOwnerAddresses,
  })
  const holders = rankedHolders.map<CommunityCollectionLeaderboardHolderEntity>((holder, index) => ({
    assetTotal: holder.assetTotal,
    displayName: holder.displayName,
    holderId: holder.holderId,
    kind: holder.kind,
    rank: index + 1,
    user: holder.user,
    wallets: holder.wallets.map((wallet) => ({
      ...wallet,
      assets: assetsByOwner.get(wallet.address) ?? [],
    })),
  }))

  return {
    assetTotal: ownerRows.reduce((total, ownerRow) => total + ownerRow.assetTotal, 0),
    holders,
    holderTotal: holdersById.size,
  }
}

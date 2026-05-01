import { useState } from 'react'
import type {
  CommunityCollectionEntity,
  CommunityCollectionLeaderboardHolderFilter,
  CommunityListCollectionLeaderboardResult,
} from '@tokengator/sdk'

import { Card, CardDescription, CardHeader, CardTitle } from '@tokengator/ui/components/card'

import {
  COMMUNITY_COLLECTION_LEADERBOARD_LIMIT_INCREMENT,
  COMMUNITY_COLLECTION_LEADERBOARD_MAX_LIMIT,
  useCommunityCollectionLeaderboardQuery,
} from '../data-access/use-community-collection-leaderboard-query'
import { CommunityUiCollectionLeaderboard } from '../ui/community-ui-collection-leaderboard'

function CommunityCollectionLeaderboardNotFoundCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Leaderboard Not Found</CardTitle>
        <CardDescription>The requested collection leaderboard could not be loaded for this community.</CardDescription>
      </CardHeader>
    </Card>
  )
}

export function CommunityFeatureCollectionLeaderboard({
  initialCollectionLeaderboard,
  selectedCollection,
  slug,
}: {
  initialCollectionLeaderboard: CommunityListCollectionLeaderboardResult | null
  selectedCollection: CommunityCollectionEntity
  slug: string
}) {
  const [holderFilter, setHolderFilter] = useState<CommunityCollectionLeaderboardHolderFilter>('known')
  const [leaderboardLimit, setLeaderboardLimit] = useState<number | undefined>(undefined)
  const currentLeaderboardLimit = leaderboardLimit ?? COMMUNITY_COLLECTION_LEADERBOARD_LIMIT_INCREMENT
  const collectionLeaderboard = useCommunityCollectionLeaderboardQuery(
    {
      address: selectedCollection.address,
      holderFilter,
      limit: leaderboardLimit,
      slug,
    },
    {
      initialData:
        holderFilter === 'known' && leaderboardLimit === undefined ? initialCollectionLeaderboard : undefined,
      keepPreviousData: leaderboardLimit !== undefined,
    },
  )

  if (!collectionLeaderboard.data && !collectionLeaderboard.error && !collectionLeaderboard.isPending) {
    return <CommunityCollectionLeaderboardNotFoundCard />
  }

  const fallbackLeaderboard: CommunityListCollectionLeaderboardResult = {
    assetTotal: initialCollectionLeaderboard?.assetTotal ?? 0,
    holders: [],
    holderTotal: 0,
  }
  const displayLeaderboard = collectionLeaderboard.data ?? fallbackLeaderboard

  return (
    <>
      {collectionLeaderboard.error ? (
        <div className="text-destructive text-sm">{collectionLeaderboard.error.message}</div>
      ) : null}
      {collectionLeaderboard.data || collectionLeaderboard.isPending ? (
        <CommunityUiCollectionLeaderboard
          canShowMore={
            collectionLeaderboard.data
              ? collectionLeaderboard.data.holders.length < collectionLeaderboard.data.holderTotal &&
                currentLeaderboardLimit < COMMUNITY_COLLECTION_LEADERBOARD_MAX_LIMIT
              : false
          }
          holderFilter={holderFilter}
          isLoading={collectionLeaderboard.isPending && !collectionLeaderboard.data}
          isShowingMore={collectionLeaderboard.isFetching}
          leaderboard={displayLeaderboard}
          onHolderFilterChange={(nextHolderFilter) => {
            setHolderFilter(nextHolderFilter)
            setLeaderboardLimit(undefined)
          }}
          onShowMore={() => {
            setLeaderboardLimit(
              Math.min(
                currentLeaderboardLimit + COMMUNITY_COLLECTION_LEADERBOARD_LIMIT_INCREMENT,
                COMMUNITY_COLLECTION_LEADERBOARD_MAX_LIMIT,
              ),
            )
          }}
          selectedCollection={selectedCollection}
          slug={slug}
        />
      ) : null}
    </>
  )
}

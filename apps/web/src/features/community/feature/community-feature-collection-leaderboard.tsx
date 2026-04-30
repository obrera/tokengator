import { useState } from 'react'
import type { CommunityCollectionEntity, CommunityListCollectionLeaderboardResult } from '@tokengator/sdk'

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
  const [leaderboardLimit, setLeaderboardLimit] = useState<number | undefined>(undefined)
  const currentLeaderboardLimit = leaderboardLimit ?? COMMUNITY_COLLECTION_LEADERBOARD_LIMIT_INCREMENT
  const collectionLeaderboard = useCommunityCollectionLeaderboardQuery(
    {
      address: selectedCollection.address,
      limit: leaderboardLimit,
      slug,
    },
    {
      initialData: leaderboardLimit === undefined ? initialCollectionLeaderboard : undefined,
    },
  )

  if (!collectionLeaderboard.data && !collectionLeaderboard.error && !collectionLeaderboard.isPending) {
    return <CommunityCollectionLeaderboardNotFoundCard />
  }

  if (collectionLeaderboard.isPending && !collectionLeaderboard.data) {
    return <div className="text-muted-foreground text-sm">Loading leaderboard...</div>
  }

  return (
    <>
      {collectionLeaderboard.error ? (
        <div className="text-destructive text-sm">{collectionLeaderboard.error.message}</div>
      ) : null}
      {collectionLeaderboard.data ? (
        <CommunityUiCollectionLeaderboard
          canShowMore={
            collectionLeaderboard.data.holders.length < collectionLeaderboard.data.holderTotal &&
            currentLeaderboardLimit < COMMUNITY_COLLECTION_LEADERBOARD_MAX_LIMIT
          }
          isShowingMore={collectionLeaderboard.isFetching}
          leaderboard={collectionLeaderboard.data}
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

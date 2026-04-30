import type { CommunityCollectionEntity, CommunityGetCollectionInsightsResult } from '@tokengator/sdk'

import { Card, CardDescription, CardHeader, CardTitle } from '@tokengator/ui/components/card'

import { useCommunityCollectionInsightsQuery } from '../data-access/use-community-collection-insights-query'
import { CommunityUiCollectionInsights } from '../ui/community-ui-collection-insights'

function CommunityCollectionInsightsNotFoundCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Insights Not Found</CardTitle>
        <CardDescription>The requested collection insights could not be loaded for this community.</CardDescription>
      </CardHeader>
    </Card>
  )
}

export function CommunityFeatureCollectionInsights({
  initialCollectionInsights,
  selectedCollection,
  slug,
}: {
  initialCollectionInsights: CommunityGetCollectionInsightsResult | null
  selectedCollection: CommunityCollectionEntity
  slug: string
}) {
  const collectionInsights = useCommunityCollectionInsightsQuery(
    {
      address: selectedCollection.address,
      slug,
    },
    {
      initialData: initialCollectionInsights,
    },
  )

  if (!collectionInsights.data && !collectionInsights.error && !collectionInsights.isPending) {
    return <CommunityCollectionInsightsNotFoundCard />
  }

  if (collectionInsights.isPending && !collectionInsights.data) {
    return <div className="text-muted-foreground text-sm">Loading insights...</div>
  }

  return (
    <>
      {collectionInsights.error ? (
        <div className="text-destructive text-sm">{collectionInsights.error.message}</div>
      ) : null}
      {collectionInsights.data ? (
        <CommunityUiCollectionInsights insights={collectionInsights.data} selectedCollection={selectedCollection} />
      ) : null}
    </>
  )
}

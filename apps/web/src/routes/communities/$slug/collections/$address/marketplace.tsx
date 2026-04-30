import { createFileRoute } from '@tanstack/react-router'

import { CommunityFeatureCollectionMarketplace } from '@/features/community/feature/community-feature-collection-marketplace'
import { Route as CollectionRoute } from '@/routes/communities/$slug/collections/$address/route'
import { Route as CommunityRoute } from '@/routes/communities/$slug/route'

export const Route = createFileRoute('/communities/$slug/collections/$address/marketplace')({
  component: RouteComponent,
})

function RouteComponent() {
  const { address } = CollectionRoute.useParams()
  const { community } = CommunityRoute.useRouteContext()

  if (!community) {
    return null
  }

  const selectedCollection = community.collections.find((collection) => collection.address === address)

  if (!selectedCollection) {
    return null
  }

  return <CommunityFeatureCollectionMarketplace initialCommunity={community} selectedCollection={selectedCollection} />
}

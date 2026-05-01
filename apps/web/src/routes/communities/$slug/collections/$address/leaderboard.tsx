import { createFileRoute } from '@tanstack/react-router'

import { getCommunityCollectionLeaderboardRouteQueryOptions } from '@/features/community/data-access/use-community-collection-leaderboard-query'
import { CommunityFeatureCollectionLeaderboard } from '@/features/community/feature/community-feature-collection-leaderboard'
import { Route as CollectionRoute } from '@/routes/communities/$slug/collections/$address/route'
import { Route as CommunityRoute } from '@/routes/communities/$slug/route'

export const Route = createFileRoute('/communities/$slug/collections/$address/leaderboard')({
  beforeLoad: async ({ context, params }) => {
    const collectionLeaderboard = await context.queryClient.ensureQueryData(
      getCommunityCollectionLeaderboardRouteQueryOptions({
        address: params.address,
        holderFilter: 'known',
        slug: params.slug,
      }),
    )

    return { collectionLeaderboard }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { collectionLeaderboard } = Route.useRouteContext()
  const { address } = CollectionRoute.useParams()
  const { community } = CommunityRoute.useRouteContext()

  if (!community) {
    return null
  }

  const selectedCollection = community.collections.find((collection) => collection.address === address)

  if (!selectedCollection) {
    return null
  }

  return (
    <CommunityFeatureCollectionLeaderboard
      initialCollectionLeaderboard={collectionLeaderboard}
      selectedCollection={selectedCollection}
      slug={community.slug}
    />
  )
}

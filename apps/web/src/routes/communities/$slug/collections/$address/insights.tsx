import { createFileRoute } from '@tanstack/react-router'

import { getCommunityCollectionInsightsRouteQueryOptions } from '@/features/community/data-access/use-community-collection-insights-query'
import { CommunityFeatureCollectionInsights } from '@/features/community/feature/community-feature-collection-insights'
import { Route as CollectionRoute } from '@/routes/communities/$slug/collections/$address/route'
import { Route as CommunityRoute } from '@/routes/communities/$slug/route'

export const Route = createFileRoute('/communities/$slug/collections/$address/insights')({
  beforeLoad: async ({ context, params }) => {
    const collectionInsights = await context.queryClient.ensureQueryData(
      getCommunityCollectionInsightsRouteQueryOptions({
        address: params.address,
        slug: params.slug,
      }),
    )

    return { collectionInsights }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { collectionInsights } = Route.useRouteContext()
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
    <CommunityFeatureCollectionInsights
      initialCollectionInsights={collectionInsights}
      selectedCollection={selectedCollection}
      slug={community.slug}
    />
  )
}

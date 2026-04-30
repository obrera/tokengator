import { createFileRoute } from '@tanstack/react-router'

import { CommunityFeatureCollectionAssets } from '@/features/community/feature/community-feature-collection-assets'
import { Route as CollectionRoute } from '@/routes/communities/$slug/collections/$address/route'
import { Route as CommunityRoute } from '@/routes/communities/$slug/route'

export const Route = createFileRoute('/communities/$slug/collections/$address/')({
  component: RouteComponent,
})

function RouteComponent() {
  const { collectionAssets } = CollectionRoute.useRouteContext()
  const { address } = CollectionRoute.useParams()
  const { community } = CommunityRoute.useRouteContext()
  const search = CollectionRoute.useSearch()

  if (!community) {
    return null
  }

  const selectedCollection = community.collections.find((collection) => collection.address === address)

  if (!selectedCollection) {
    return null
  }

  return (
    <CommunityFeatureCollectionAssets
      initialCollectionAssets={collectionAssets}
      search={search}
      selectedCollection={selectedCollection}
      slug={community.slug}
    />
  )
}

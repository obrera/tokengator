import { Outlet, createFileRoute } from '@tanstack/react-router'

import { getCommunityCollectionAssetsRouteQueryOptions } from '@/features/community/data-access/use-community-collection-assets-query'
import { CommunityFeatureCollectionDetail } from '@/features/community/feature/community-feature-collection-detail'
import { getCommunityCollectionCurrentTab } from '@/features/community/feature/community-feature-collection-shell'
import { validateCommunityCollectionAssetSearch } from '@/features/community/util/community-collection-asset-search'
import { Route as CommunityRoute } from '@/routes/communities/$slug/route'

export const Route = createFileRoute('/communities/$slug/collections/$address')({
  beforeLoad: async ({ context, location, params, search }) => {
    const currentTab = getCommunityCollectionCurrentTab(location.pathname)
    const collectionAssets =
      currentTab === 'assets'
        ? await context.queryClient.ensureQueryData(
            getCommunityCollectionAssetsRouteQueryOptions({
              address: params.address,
              facets: search.facets,
              owner: search.owner,
              query: search.query,
              slug: params.slug,
            }),
          )
        : null

    return { collectionAssets }
  },
  component: RouteComponent,
  validateSearch: validateCommunityCollectionAssetSearch,
})

function RouteComponent() {
  const { address } = Route.useParams()
  const { community } = CommunityRoute.useRouteContext()
  const search = Route.useSearch()

  if (!community) {
    return null
  }

  return (
    <>
      <CommunityFeatureCollectionDetail address={address} initialCommunity={community} search={search}>
        <Outlet />
      </CommunityFeatureCollectionDetail>
    </>
  )
}

import { queryOptions, useQuery } from '@tanstack/react-query'

import { orpc } from '@/lib/orpc'

export function getCommunityAssetMarketplaceListingsQueryKey(input: {
  assetGroupId: string
  limit: number
  slug: string
}) {
  return orpc.community.listAssetMarketplaceListings.key({
    input,
  })
}

export function getCommunityAssetMarketplaceListingsQueryOptions(input: {
  assetGroupId: string
  enabled?: boolean
  limit: number
  slug: string
}) {
  return queryOptions({
    enabled: input.enabled !== false && Boolean(input.assetGroupId && input.slug),
    queryFn: () =>
      orpc.community.listAssetMarketplaceListings.call({
        assetGroupId: input.assetGroupId,
        limit: input.limit,
        slug: input.slug,
      }),
    queryKey: getCommunityAssetMarketplaceListingsQueryKey({
      assetGroupId: input.assetGroupId,
      limit: input.limit,
      slug: input.slug,
    }),
  })
}

export function useCommunityAssetMarketplaceListingsQuery(input: {
  assetGroupId: string
  enabled?: boolean
  limit: number
  slug: string
}) {
  return useQuery(getCommunityAssetMarketplaceListingsQueryOptions(input))
}

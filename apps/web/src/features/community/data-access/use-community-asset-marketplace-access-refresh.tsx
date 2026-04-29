import { useMutation, useQueryClient } from '@tanstack/react-query'

import { orpc } from '@/lib/orpc'

import { getCommunityBySlugQueryKey } from './use-community-by-slug-query'

export function useCommunityAssetMarketplaceAccessRefresh() {
  const queryClient = useQueryClient()

  return useMutation(
    orpc.community.refreshAssetMarketplaceAccess.mutationOptions({
      onSuccess: (result) => {
        queryClient.setQueryData(getCommunityBySlugQueryKey(result.community.slug), result.community)
      },
    }),
  )
}

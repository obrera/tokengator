import { useMutation } from '@tanstack/react-query'

import { orpc } from '@/lib/orpc'

export function useCommunityAssetMarketplaceBuyPrepare() {
  return useMutation(orpc.community.prepareAssetMarketplaceBuy.mutationOptions())
}

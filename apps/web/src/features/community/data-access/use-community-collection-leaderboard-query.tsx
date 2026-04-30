import { queryOptions, useQuery } from '@tanstack/react-query'
import type { CommunityListCollectionLeaderboardResult } from '@tokengator/sdk'

import { orpc } from '@/lib/orpc'

export const COMMUNITY_COLLECTION_LEADERBOARD_LIMIT_INCREMENT = 100
export const COMMUNITY_COLLECTION_LEADERBOARD_MAX_LIMIT = 1000

export interface CommunityCollectionLeaderboardInput {
  address: string
  limit?: number
  slug: string
}

function isNotFoundError(error: unknown): error is { code: string } {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'NOT_FOUND'
}

async function getCommunityCollectionLeaderboardOrNull(
  query: () => Promise<CommunityListCollectionLeaderboardResult | null>,
) {
  try {
    return await query()
  } catch (error) {
    if (isNotFoundError(error)) {
      return null
    }

    throw error
  }
}

export function getCommunityCollectionLeaderboardQueryKey(input: CommunityCollectionLeaderboardInput) {
  return orpc.community.listCollectionLeaderboard.key({
    input: {
      address: input.address,
      limit: input.limit,
      slug: input.slug,
    },
  })
}

export function getCommunityCollectionLeaderboardQueryOptions(input: CommunityCollectionLeaderboardInput) {
  return queryOptions({
    enabled: Boolean(input.address) && Boolean(input.slug),
    placeholderData: (previousData) => previousData,
    queryFn: () =>
      getCommunityCollectionLeaderboardOrNull(() =>
        orpc.community.listCollectionLeaderboard.call({
          address: input.address,
          limit: input.limit,
          slug: input.slug,
        }),
      ),
    queryKey: getCommunityCollectionLeaderboardQueryKey(input),
  })
}

export function getCommunityCollectionLeaderboardRouteQueryOptions(input: CommunityCollectionLeaderboardInput) {
  return queryOptions({
    enabled: Boolean(input.address) && Boolean(input.slug),
    queryFn: async () =>
      getCommunityCollectionLeaderboardOrNull(() =>
        import('./get-community-collection-leaderboard-fn').then(({ getCommunityCollectionLeaderboard }) =>
          getCommunityCollectionLeaderboard({
            data: {
              address: input.address,
              limit: input.limit,
              slug: input.slug,
            },
          }),
        ),
      ),
    queryKey: getCommunityCollectionLeaderboardQueryKey(input),
  })
}

export function useCommunityCollectionLeaderboardQuery(
  input: CommunityCollectionLeaderboardInput,
  options?: {
    initialData?: CommunityListCollectionLeaderboardResult | null
  },
) {
  return useQuery({
    ...getCommunityCollectionLeaderboardQueryOptions(input),
    initialData: options?.initialData,
  })
}

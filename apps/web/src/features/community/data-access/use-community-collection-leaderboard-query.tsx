import { queryOptions, useQuery } from '@tanstack/react-query'
import type {
  CommunityCollectionLeaderboardHolderFilter,
  CommunityListCollectionLeaderboardResult,
} from '@tokengator/sdk'

import { orpc } from '@/lib/orpc'

export const COMMUNITY_COLLECTION_LEADERBOARD_LIMIT_INCREMENT = 100
export const COMMUNITY_COLLECTION_LEADERBOARD_MAX_LIMIT = 1000

export interface CommunityCollectionLeaderboardInput {
  address: string
  holderFilter?: CommunityCollectionLeaderboardHolderFilter
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
      holderFilter: input.holderFilter,
      limit: input.limit,
      slug: input.slug,
    },
  })
}

export function getCommunityCollectionLeaderboardQueryOptions(
  input: CommunityCollectionLeaderboardInput,
  options?: {
    keepPreviousData?: boolean
  },
) {
  return queryOptions({
    enabled: Boolean(input.address) && Boolean(input.slug),
    placeholderData: options?.keepPreviousData ? (previousData) => previousData : undefined,
    queryFn: () =>
      getCommunityCollectionLeaderboardOrNull(() =>
        orpc.community.listCollectionLeaderboard.call({
          address: input.address,
          holderFilter: input.holderFilter,
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
              holderFilter: input.holderFilter,
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
    keepPreviousData?: boolean
  },
) {
  return useQuery({
    ...getCommunityCollectionLeaderboardQueryOptions(input, {
      keepPreviousData: options?.keepPreviousData,
    }),
    initialData: options?.initialData,
  })
}

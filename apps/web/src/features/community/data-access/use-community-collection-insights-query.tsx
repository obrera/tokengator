import { queryOptions, useQuery } from '@tanstack/react-query'
import type { CommunityGetCollectionInsightsResult } from '@tokengator/sdk'

import { orpc } from '@/lib/orpc'

export interface CommunityCollectionInsightsInput {
  address: string
  slug: string
}

function isNotFoundError(error: unknown): error is { code: string } {
  return typeof error === 'object' && error !== null && 'code' in error && error.code === 'NOT_FOUND'
}

async function getCommunityCollectionInsightsOrNull(query: () => Promise<CommunityGetCollectionInsightsResult | null>) {
  try {
    return await query()
  } catch (error) {
    if (isNotFoundError(error)) {
      return null
    }

    throw error
  }
}

export function getCommunityCollectionInsightsQueryKey(input: CommunityCollectionInsightsInput) {
  return orpc.community.getCollectionInsights.key({
    input: {
      address: input.address,
      slug: input.slug,
    },
  })
}

export function getCommunityCollectionInsightsQueryOptions(input: CommunityCollectionInsightsInput) {
  return queryOptions({
    enabled: Boolean(input.address) && Boolean(input.slug),
    queryFn: () =>
      getCommunityCollectionInsightsOrNull(() =>
        orpc.community.getCollectionInsights.call({
          address: input.address,
          slug: input.slug,
        }),
      ),
    queryKey: getCommunityCollectionInsightsQueryKey(input),
  })
}

export function getCommunityCollectionInsightsRouteQueryOptions(input: CommunityCollectionInsightsInput) {
  return queryOptions({
    enabled: Boolean(input.address) && Boolean(input.slug),
    queryFn: async () =>
      getCommunityCollectionInsightsOrNull(() =>
        import('./get-community-collection-insights-fn').then(({ getCommunityCollectionInsights }) =>
          getCommunityCollectionInsights({
            data: {
              address: input.address,
              slug: input.slug,
            },
          }),
        ),
      ),
    queryKey: getCommunityCollectionInsightsQueryKey(input),
  })
}

export function useCommunityCollectionInsightsQuery(
  input: CommunityCollectionInsightsInput,
  options?: {
    initialData?: CommunityGetCollectionInsightsResult | null
  },
) {
  return useQuery({
    ...getCommunityCollectionInsightsQueryOptions(input),
    initialData: options?.initialData,
  })
}

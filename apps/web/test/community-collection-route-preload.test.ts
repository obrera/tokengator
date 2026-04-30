import { afterAll, beforeAll, describe, expect, mock, test } from 'bun:test'

let CollectionRoute: typeof import('../src/routes/communities/$slug/collections/$address/route').Route

const communityCollectionAssetsQueryMock = {
  getCommunityCollectionAssetsQueryKey: (input: unknown) => ['collection-assets', input],
  getCommunityCollectionAssetsQueryOptions: (input: unknown) => ({
    input,
    queryKey: ['collection-assets'],
  }),
  getCommunityCollectionAssetsRouteQueryOptions: (input: unknown) => ({
    input,
    queryKey: ['collection-assets'],
  }),
  useCommunityCollectionAssetsQuery: (_input: unknown, options?: { initialData?: unknown }) => ({
    data: options?.initialData,
    error: null,
    isPending: false,
  }),
}

beforeAll(async () => {
  mock.module(
    '@/features/community/data-access/use-community-collection-assets-query',
    () => communityCollectionAssetsQueryMock,
  )
  mock.module(
    '@/features/community/data-access/use-community-collection-assets-query.tsx',
    () => communityCollectionAssetsQueryMock,
  )
  mock.module('@/routes/communities/$slug/route', () => ({
    Route: {
      useRouteContext: () => ({
        community: null,
      }),
    },
  }))

  ;({ Route: CollectionRoute } = await import('../src/routes/communities/$slug/collections/$address/route'))
})

afterAll(() => {
  mock.restore()
})

describe('collection route preload', () => {
  test('preloads collection assets for the base assets tab', async () => {
    const ensureQueryData = mock(async () => ({
      assets: [],
      facetTotals: {},
    }))

    await expect(
      CollectionRoute.options.beforeLoad?.({
        context: {
          queryClient: {
            ensureQueryData,
          },
        },
        location: {
          pathname: '/communities/acme/collections/collection-alpha',
        },
        params: {
          address: 'collection-alpha',
          slug: 'acme',
        },
        search: {
          facets: undefined,
          grid: 8,
          owner: undefined,
          query: undefined,
        },
      } as never),
    ).resolves.toEqual({
      collectionAssets: {
        assets: [],
        facetTotals: {},
      },
    })
    expect(ensureQueryData).toHaveBeenCalledTimes(1)
  })

  test('skips collection asset preload for analytics tabs', async () => {
    const ensureQueryData = mock(async () => {
      throw new Error('Collection assets should not be preloaded.')
    })

    await expect(
      CollectionRoute.options.beforeLoad?.({
        context: {
          queryClient: {
            ensureQueryData,
          },
        },
        location: {
          pathname: '/communities/acme/collections/collection-alpha/insights',
        },
        params: {
          address: 'collection-alpha',
          slug: 'acme',
        },
        search: {
          facets: undefined,
          grid: 8,
          owner: undefined,
          query: undefined,
        },
      } as never),
    ).resolves.toEqual({
      collectionAssets: null,
    })
    expect(ensureQueryData).not.toHaveBeenCalled()
  })
})

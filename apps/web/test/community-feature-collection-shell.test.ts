import { describe, expect, test } from 'bun:test'
import type { CommunityGetBySlugResult } from '@tokengator/sdk'

import {
  getCommunityCollectionCurrentTab,
  getCommunityCollectionSwitchNavigation,
  getCommunityCollectionVisibleTabs,
} from '../src/features/community/feature/community-feature-collection-shell'

function createCommunity(): CommunityGetBySlugResult {
  return {
    collections: [
      {
        address: 'collection-alpha',
        assetMarketplace: {
          assetGroupId: 'asset-group-alpha',
          enabled: true,
          unavailableReason: null,
        },
        facetTotals: {},
        id: 'asset-group-alpha',
        imageUrl: 'https://example.com/collection-alpha.png',
        label: 'Alpha Collection',
        symbolMagicEden: 'alpha-symbol',
        type: 'collection',
      },
      {
        address: 'collection-beta',
        assetMarketplace: {
          assetGroupId: 'asset-group-beta',
          enabled: false,
          unavailableReason: 'missing-symbol',
        },
        facetTotals: {},
        id: 'asset-group-beta',
        imageUrl: 'https://example.com/collection-beta.png',
        label: 'Beta Collection',
        symbolMagicEden: null,
        type: 'collection',
      },
    ],
    id: 'community-alpha',
    logo: null,
    marketplace: {
      magicEden: {
        enabled: true,
        unavailableReason: null,
      },
    },
    name: 'Alpha DAO',
    roles: [
      {
        assetGroups: [
          {
            address: 'collection-alpha',
            id: 'asset-group-alpha',
            imageUrl: 'https://example.com/collection-alpha.png',
            label: 'Alpha Collection',
            maximumAmount: null,
            minimumAmount: '1',
            resolverKind: 'helius-collection-assets',
            symbolMagicEden: 'alpha-symbol',
            type: 'collection',
          },
        ],
        assigned: false,
        assignedAssetGroups: [],
        id: 'role-alpha',
        matchMode: 'any',
        name: 'Alpha Role',
        slug: 'alpha-role',
      },
      {
        assetGroups: [
          {
            address: 'collection-beta',
            id: 'asset-group-beta',
            imageUrl: 'https://example.com/collection-beta.png',
            label: 'Beta Collection',
            maximumAmount: null,
            minimumAmount: '1',
            resolverKind: 'helius-collection-assets',
            symbolMagicEden: null,
            type: 'collection',
          },
        ],
        assigned: false,
        assignedAssetGroups: [],
        id: 'role-beta',
        matchMode: 'any',
        name: 'Beta Role',
        slug: 'beta-role',
      },
    ],
    slug: 'alpha-dao',
  }
}

describe('CommunityFeatureCollectionShell helpers', () => {
  test('identifies the active collection tab from the URL path', () => {
    expect(getCommunityCollectionCurrentTab('/communities/acme/collections/collection-alpha')).toBe('assets')
    expect(getCommunityCollectionCurrentTab('/communities/acme/collections/collection-alpha/asset/mint-alpha')).toBe(
      'assets',
    )
    expect(getCommunityCollectionCurrentTab('/communities/acme/collections/collection-alpha/asset/insights')).toBe(
      'assets',
    )
    expect(getCommunityCollectionCurrentTab('/communities/acme/collections/collection-alpha/asset/leaderboard')).toBe(
      'assets',
    )
    expect(getCommunityCollectionCurrentTab('/communities/acme/collections/collection-alpha/insights')).toBe('insights')
    expect(getCommunityCollectionCurrentTab('/communities/acme/collections/collection-alpha/leaderboard')).toBe(
      'leaderboard',
    )
    expect(getCommunityCollectionCurrentTab('/communities/acme/collections/collection-alpha/marketplace')).toBe(
      'marketplace',
    )
    expect(getCommunityCollectionCurrentTab('/communities/acme/collections/insights')).toBe('assets')
    expect(getCommunityCollectionCurrentTab('/communities/acme/collections/leaderboard')).toBe('assets')
    expect(getCommunityCollectionCurrentTab('/communities/acme/collections/marketplace')).toBe('assets')
  })

  test('preserves the active collection tab when switching collections', () => {
    expect(
      getCommunityCollectionSwitchNavigation({
        address: 'collection-beta',
        search: {
          facets: {
            background: ['forest'],
          },
          grid: 8,
          owner: 'owner-alpha',
          query: 'perk',
        },
        slug: 'acme',
        tab: 'leaderboard',
      }),
    ).toEqual({
      params: {
        address: 'collection-beta',
        slug: 'acme',
      },
      search: {
        facets: undefined,
        grid: 8,
        owner: undefined,
        query: undefined,
      },
      to: '/communities/$slug/collections/$address/leaderboard',
    })
  })

  test('hides the marketplace tab unless the collection is buyable', () => {
    const community = createCommunity()

    expect(
      getCommunityCollectionVisibleTabs({
        community,
        selectedCollection: community.collections[0]!,
      }).map((tab) => tab.value),
    ).toEqual(['assets', 'insights', 'leaderboard', 'marketplace'])
    expect(
      getCommunityCollectionVisibleTabs({
        community,
        selectedCollection: community.collections[1]!,
      }).map((tab) => tab.value),
    ).toEqual(['assets', 'insights', 'leaderboard'])
  })

  test('falls back to the assets tab when switching to a collection without marketplace access', () => {
    const community = createCommunity()

    expect(
      getCommunityCollectionSwitchNavigation({
        address: 'collection-alpha',
        community,
        search: {
          facets: undefined,
          grid: 8,
          owner: 'owner-alpha',
          query: 'perk',
        },
        slug: 'acme',
        tab: 'marketplace',
      }),
    ).toEqual({
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
      to: '/communities/$slug/collections/$address/marketplace',
    })
    expect(
      getCommunityCollectionSwitchNavigation({
        address: 'collection-beta',
        community,
        search: {
          facets: undefined,
          grid: 8,
          owner: 'owner-alpha',
          query: 'perk',
        },
        slug: 'acme',
        tab: 'marketplace',
      }),
    ).toEqual({
      params: {
        address: 'collection-beta',
        slug: 'acme',
      },
      search: {
        facets: undefined,
        grid: 8,
        owner: undefined,
        query: undefined,
      },
      to: '/communities/$slug/collections/$address',
    })
  })
})

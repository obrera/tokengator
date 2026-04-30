import { describe, expect, test } from 'bun:test'

import {
  getCommunityCollectionCurrentTab,
  getCommunityCollectionSwitchNavigation,
} from '../src/features/community/feature/community-feature-collection-shell'

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
    expect(getCommunityCollectionCurrentTab('/communities/acme/collections/insights')).toBe('assets')
    expect(getCommunityCollectionCurrentTab('/communities/acme/collections/leaderboard')).toBe('assets')
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
})

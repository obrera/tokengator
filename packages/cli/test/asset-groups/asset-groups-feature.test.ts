import { afterEach, describe, expect, mock, test } from 'bun:test'

import type { AdminApiClient, AdminAssetGroup } from '../../src/api/data-access/admin-api-client'
import { assetGroupsFeatureCreate } from '../../src/asset-groups/asset-groups-feature-create'
import { assetGroupsFeatureDelete } from '../../src/asset-groups/asset-groups-feature-delete'
import { assetGroupsFeatureIndex } from '../../src/asset-groups/asset-groups-feature-index'
import { assetGroupsFeatureIndexRuns } from '../../src/asset-groups/asset-groups-feature-index-runs'
import { assetGroupsFeatureList } from '../../src/asset-groups/asset-groups-feature-list'
import { assetGroupsFeatureLookup } from '../../src/asset-groups/asset-groups-feature-lookup'
import { assetGroupsFeatureUpdate } from '../../src/asset-groups/asset-groups-feature-update'

const originalConsoleLog = console.log

function createAssetGroup(overrides: Partial<AdminAssetGroup> = {}): AdminAssetGroup {
  return {
    address: 'asset-address',
    decimals: 0,
    enabled: true,
    id: 'asset-group-id',
    imageUrl: 'https://example.com/image.png',
    label: 'Asset Group',
    resolverKind: 'helius-collection-assets',
    symbol: 'ASSET',
    type: 'collection',
    ...overrides,
  }
}

function createMockApiClient(overrides: Partial<AdminApiClient> = {}): AdminApiClient {
  return {
    assetGroupCreate: async () => createAssetGroup(),
    assetGroupDelete: async (input) => input,
    assetGroupGet: async () => createAssetGroup(),
    assetGroupIndex: async () => ({ assetGroupId: 'asset-group-id', total: 1 }),
    assetGroupList: async () => ({ assetGroups: [createAssetGroup()], limit: 25, offset: 0, total: 1 }),
    assetGroupListIndexRuns: async () => ({
      indexRuns: [
        {
          id: 'run-id',
          status: 'succeeded',
        },
      ],
    }),
    assetGroupLookup: async () => ({
      account: 'asset-address',
      suggestion: {
        address: 'asset-address',
        label: 'Asset Group',
        resolvable: true,
      },
    }),
    assetGroupUpdate: async () => createAssetGroup(),
    communityRoleCreate: async () => {
      throw new Error('not implemented')
    },
    organizationAddMember: async () => {
      throw new Error('not implemented')
    },
    organizationCreate: async () => {
      throw new Error('not implemented')
    },
    organizationDelete: async () => {
      throw new Error('not implemented')
    },
    organizationGet: async () => {
      throw new Error('not implemented')
    },
    organizationList: async () => {
      throw new Error('not implemented')
    },
    organizationListOwnerCandidates: async () => {
      throw new Error('not implemented')
    },
    organizationUpdate: async () => {
      throw new Error('not implemented')
    },
    organizationUpsertDiscordConnection: async () => {
      throw new Error('not implemented')
    },
    userCreate: async () => {
      throw new Error('not implemented')
    },
    userGet: async () => {
      throw new Error('not implemented')
    },
    userLinkDiscordAccount: async () => {
      throw new Error('not implemented')
    },
    userLinkSolanaWallet: async () => {
      throw new Error('not implemented')
    },
    userList: async () => {
      throw new Error('not implemented')
    },
    userUpdate: async () => {
      throw new Error('not implemented')
    },
    ...overrides,
  }
}

afterEach(() => {
  console.log = originalConsoleLog
})

describe('asset-groups features', () => {
  test('creates disabled asset groups with optional metadata', async () => {
    let body: unknown
    const apiClient = createMockApiClient({
      assetGroupCreate: async (input) => {
        body = input

        return createAssetGroup({ enabled: false })
      },
    })

    await assetGroupsFeatureCreate({
      address: 'asset-address',
      apiClient,
      decimals: 9,
      disabled: true,
      imageUrl: 'https://example.com/image.png',
      label: 'Asset Group',
      resolverKind: 'helius-token-accounts',
      symbol: 'ASSET',
      type: 'mint',
    })

    expect(body).toEqual({
      address: 'asset-address',
      decimals: 9,
      enabled: false,
      imageUrl: 'https://example.com/image.png',
      label: 'Asset Group',
      resolverKind: 'helius-token-accounts',
      symbol: 'ASSET',
      type: 'mint',
    })
  })

  test('requires --yes for non-interactive deletes', async () => {
    const apiClient = createMockApiClient()

    await expect(assetGroupsFeatureDelete('asset-group-id', { apiClient })).rejects.toThrow(
      'Pass --yes to confirm this destructive action.',
    )
  })

  test('calls extra admin asset group operations', async () => {
    const calls: string[] = []
    const apiClient = createMockApiClient({
      assetGroupIndex: async () => {
        calls.push('index')

        return { assetGroupId: 'asset-group-id' }
      },
      assetGroupList: async (input) => {
        calls.push(`list:${input?.search}`)

        return { assetGroups: [], limit: 10, offset: 0, total: 0 }
      },
      assetGroupListIndexRuns: async (input) => {
        calls.push(`runs:${input.limit}`)

        return { indexRuns: [] }
      },
      assetGroupLookup: async (input) => {
        calls.push(`lookup:${input.address}`)

        return { account: input.address, suggestion: {} }
      },
    })

    await assetGroupsFeatureIndex('asset-group-id', { apiClient })
    await assetGroupsFeatureIndexRuns('asset-group-id', { apiClient, limit: 5 })
    await assetGroupsFeatureList({ apiClient, search: 'asset' })
    await assetGroupsFeatureLookup('asset-address', { apiClient })

    expect(calls).toEqual(['index', 'runs:5', 'list:asset', 'lookup:asset-address'])
  })

  test('merges asset group updates and clears nullable fields', async () => {
    let body: unknown
    const apiClient = createMockApiClient({
      assetGroupGet: async () => createAssetGroup(),
      assetGroupUpdate: async (input) => {
        body = input

        return createAssetGroup({
          imageUrl: null,
          resolverKind: 'helius-token-accounts',
          symbol: null,
          type: 'mint',
        })
      },
    })

    await assetGroupsFeatureUpdate('asset-group-id', {
      apiClient,
      clearImageUrl: true,
      clearSymbol: true,
      disabled: true,
      resolverKind: 'helius-token-accounts',
      type: 'mint',
    })

    expect(body).toEqual({
      assetGroupId: 'asset-group-id',
      data: {
        address: 'asset-address',
        decimals: 0,
        enabled: false,
        imageUrl: null,
        label: 'Asset Group',
        resolverKind: 'helius-token-accounts',
        symbol: null,
        type: 'mint',
      },
    })
  })

  test('requires resolver kind when changing to an incompatible type', async () => {
    const apiClient = createMockApiClient({
      assetGroupGet: async () => createAssetGroup(),
    })

    await expect(assetGroupsFeatureUpdate('asset-group-id', { apiClient, type: 'mint' })).rejects.toThrow(
      'Use --resolver-kind when changing to a type that is incompatible with the current resolver kind.',
    )
  })

  test('rejects resolver kind that is incompatible with the next type', async () => {
    const apiClient = createMockApiClient({
      assetGroupGet: async () => createAssetGroup(),
    })

    await expect(
      assetGroupsFeatureUpdate('asset-group-id', {
        apiClient,
        resolverKind: 'helius-collection-assets',
        type: 'mint',
      }),
    ).rejects.toThrow('Use a resolver kind that is compatible with the selected type.')
  })

  test('prints JSON output for scripts', async () => {
    const messages: string[] = []

    console.log = mock((message: string) => {
      messages.push(message)
    }) as typeof console.log

    await assetGroupsFeatureList({
      apiClient: createMockApiClient({
        assetGroupList: async () => ({ assetGroups: [], limit: 25, offset: 0, total: 0 }),
      }),
      json: true,
    })

    expect(messages.join('\n')).toContain('"assetGroups": []')
  })
})

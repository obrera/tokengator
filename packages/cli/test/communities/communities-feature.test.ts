import { afterEach, describe, expect, mock, test } from 'bun:test'

import type { AdminApiClient, AdminOrganization } from '../../src/api/data-access/admin-api-client'
import {
  communitiesFeatureCreate,
  communitiesFeatureDelete,
  communitiesFeatureList,
  communitiesFeatureOwnerCandidates,
  communitiesFeatureUpdate,
} from '../../src/communities/communities-feature'

const originalConsoleLog = console.log

function createCommunity(overrides: Partial<AdminOrganization> = {}): AdminOrganization {
  return {
    description: 'Current description',
    discordUrl: 'https://discord.example.com',
    githubUrl: 'https://github.com/example',
    id: 'community-id',
    logo: 'https://example.com/logo.png',
    memberCount: 1,
    name: 'Current Community',
    owners: [
      {
        name: 'Owner',
        userId: 'owner-id',
        username: 'owner',
      },
    ],
    slug: 'current-community',
    telegramUrl: 'https://t.me/example',
    websiteUrl: 'https://example.com',
    xUrl: 'https://x.com/example',
    ...overrides,
  }
}

function createMockApiClient(overrides: Partial<AdminApiClient> = {}): AdminApiClient {
  return {
    assetGroupCreate: async () => {
      throw new Error('not implemented')
    },
    assetGroupDelete: async () => {
      throw new Error('not implemented')
    },
    assetGroupGet: async () => {
      throw new Error('not implemented')
    },
    assetGroupIndex: async () => {
      throw new Error('not implemented')
    },
    assetGroupList: async () => {
      throw new Error('not implemented')
    },
    assetGroupListIndexRuns: async () => {
      throw new Error('not implemented')
    },
    assetGroupLookup: async () => {
      throw new Error('not implemented')
    },
    assetGroupUpdate: async () => {
      throw new Error('not implemented')
    },
    organizationCreate: async () => createCommunity(),
    organizationDelete: async (input) => input,
    organizationGet: async () => createCommunity(),
    organizationList: async () => ({ limit: 25, offset: 0, organizations: [createCommunity()], total: 1 }),
    organizationListOwnerCandidates: async () => [
      {
        id: 'owner-id',
        name: 'Owner',
        username: 'owner',
      },
    ],
    organizationUpdate: async () => createCommunity(),
    ...overrides,
  }
}

afterEach(() => {
  console.log = originalConsoleLog
})

describe('communities features', () => {
  test('creates communities with the requested owner', async () => {
    let body: unknown
    const apiClient = createMockApiClient({
      organizationCreate: async (input) => {
        body = input

        return createCommunity({
          name: input.name,
          slug: input.slug,
        })
      },
    })

    await communitiesFeatureCreate({
      apiClient,
      logo: 'https://example.com/logo.png',
      name: 'New Community',
      ownerUserId: 'owner-id',
      slug: 'new-community',
    })

    expect(body).toEqual({
      logo: 'https://example.com/logo.png',
      name: 'New Community',
      ownerUserId: 'owner-id',
      slug: 'new-community',
    })
  })

  test('requires --yes for non-interactive deletes', async () => {
    const apiClient = createMockApiClient()

    await expect(communitiesFeatureDelete('community-id', { apiClient })).rejects.toThrow(
      'Pass --yes to confirm this destructive action.',
    )
  })

  test('lists communities and owner candidates with filters', async () => {
    const calls: string[] = []
    const apiClient = createMockApiClient({
      organizationList: async (input) => {
        calls.push(`list:${input?.limit}:${input?.offset}:${input?.search}`)

        return { limit: 10, offset: 5, organizations: [], total: 0 }
      },
      organizationListOwnerCandidates: async (input) => {
        calls.push(`owners:${input?.limit}:${input?.search}`)

        return []
      },
    })

    await communitiesFeatureList({ apiClient, limit: 10, offset: 5, search: 'community' })
    await communitiesFeatureOwnerCandidates({ apiClient, limit: 5, search: 'owner' })

    expect(calls).toEqual(['list:10:5:community', 'owners:5:owner'])
  })

  test('merges community updates and clears optional fields', async () => {
    let body: unknown
    const apiClient = createMockApiClient({
      organizationGet: async () => createCommunity(),
      organizationUpdate: async (input) => {
        body = input

        return createCommunity({
          description: null,
          name: input.data.name,
        })
      },
    })

    await communitiesFeatureUpdate('community-id', {
      apiClient,
      clearDescription: true,
      name: 'Updated Community',
    })

    expect(body).toEqual({
      data: {
        description: '',
        discordUrl: 'https://discord.example.com',
        githubUrl: 'https://github.com/example',
        logo: 'https://example.com/logo.png',
        name: 'Updated Community',
        slug: 'current-community',
        telegramUrl: 'https://t.me/example',
        websiteUrl: 'https://example.com',
        xUrl: 'https://x.com/example',
      },
      organizationId: 'community-id',
    })
  })

  test('prints JSON output for scripts', async () => {
    const messages: string[] = []

    console.log = mock((message: string) => {
      messages.push(message)
    }) as typeof console.log

    await communitiesFeatureOwnerCandidates({
      apiClient: createMockApiClient({
        organizationListOwnerCandidates: async () => [],
      }),
      json: true,
    })

    expect(messages.join('\n')).toBe('[]')
  })
})

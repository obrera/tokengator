import { afterAll, beforeAll, beforeEach, describe, expect, mock, test } from 'bun:test'
import { renderToStaticMarkup } from 'react-dom/server'
import type { ProfileApiKeyEntity } from '@tokengator/sdk'
import type { AppSession } from '../src/features/auth/data-access/get-app-auth-state'

let appAuthStateDeveloperMode = false
let apiKeysData: { apiKeys: ProfileApiKeyEntity[] } | undefined = { apiKeys: [] }
let profileSettingsData: { settings: { developerMode: boolean; private: boolean } } | undefined
let profileSettingsPending = false
let ProfileFeatureSettings: typeof import('../src/features/profile/feature/profile-feature-settings').ProfileFeatureSettings
let revokingApiKeyCounts: Record<string, number> = {}
const session: AppSession = {
  user: {
    id: 'user-1',
    image: null,
    name: 'Test User',
    username: 'beeman.dev',
  },
}
const profileFeatureSettingsProps = {
  session,
  username: 'beeman.dev',
}

function createApiKey(overrides: Partial<ProfileApiKeyEntity> = {}): ProfileApiKeyEntity {
  return {
    createdAt: new Date('2026-04-11T00:00:00.000Z'),
    enabled: true,
    expiresAt: new Date('2026-07-10T00:00:00.000Z'),
    id: 'api-key-1',
    lastRequest: new Date('2026-04-12T00:00:00.000Z'),
    name: 'Tokengator CLI on test-host',
    prefix: 'tg_cli_',
    requestCount: 12,
    start: 'tg_cli_abcd',
    ...overrides,
  }
}

beforeAll(async () => {
  mock.module('@/features/auth/data-access/use-app-auth-state-query', () => ({
    useAppAuthStateQuery: () => ({
      data: {
        profileSettings: {
          settings: {
            developerMode: appAuthStateDeveloperMode,
            private: false,
          },
        },
      },
    }),
  }))

  mock.module('../src/features/profile/data-access/use-profile-get-settings', () => ({
    useProfileSettings: () => ({
      data: profileSettingsData,
      isPending: profileSettingsPending,
    }),
  }))

  mock.module('../src/features/profile/data-access/use-profile-list-api-keys', () => ({
    useProfileListApiKeys: () => ({
      data: apiKeysData,
    }),
  }))

  mock.module('../src/features/profile/data-access/use-profile-revoke-api-key', () => ({
    useProfileRevokeApiKey: () => ({
      revokeApiKey: async () => true,
      revokingApiKeyCounts,
    }),
  }))

  mock.module('../src/features/profile/data-access/use-profile-update-settings', () => ({
    useProfileUpdateSettings: () => ({
      isPending: false,
      pendingSettings: null,
      updateSettings: async () => {},
    }),
  }))

  ;({ ProfileFeatureSettings } = await import('../src/features/profile/feature/profile-feature-settings'))
})

afterAll(() => {
  mock.restore()
})

describe('ProfileFeatureSettings', () => {
  beforeEach(() => {
    appAuthStateDeveloperMode = false
    apiKeysData = { apiKeys: [] }
    profileSettingsData = undefined
    profileSettingsPending = false
    revokingApiKeyCounts = {}
  })

  test('uses app auth state as the initial SSR source for developer mode', () => {
    appAuthStateDeveloperMode = true
    profileSettingsData = undefined
    profileSettingsPending = true

    const markup = renderToStaticMarkup(<ProfileFeatureSettings {...profileFeatureSettingsProps} />)

    expect(markup).toContain('aria-checked="true"')
    expect(markup).not.toContain('aria-disabled="true"')
  })

  test('renders redacted API key metadata', () => {
    apiKeysData = {
      apiKeys: [createApiKey()],
    }

    const markup = renderToStaticMarkup(<ProfileFeatureSettings {...profileFeatureSettingsProps} />)

    expect(markup).toContain('API Keys')
    expect(markup).toContain('Tokengator CLI on test-host')
    expect(markup).toContain('tg_cli_abcd')
    expect(markup).toContain('12')
    expect(markup).not.toContain('tg_cli_super_secret')
  })

  test('renders the empty API key state', () => {
    apiKeysData = {
      apiKeys: [],
    }

    const markup = renderToStaticMarkup(<ProfileFeatureSettings {...profileFeatureSettingsProps} />)

    expect(markup).toContain('No API keys yet.')
  })

  test('renders the API key revoke pending state', () => {
    apiKeysData = {
      apiKeys: [createApiKey()],
    }
    revokingApiKeyCounts = {
      'api-key-1': 1,
    }

    const markup = renderToStaticMarkup(<ProfileFeatureSettings {...profileFeatureSettingsProps} />)

    expect(markup).toContain('Revoking')
  })
})

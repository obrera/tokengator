import { afterEach, describe, expect, test } from 'bun:test'
import { writeFileSync } from 'node:fs'

import {
  clearStoredAuthCredentials,
  getAuthenticatedHeaders,
  getStoredAuthCredentials,
  setStoredAuthCredentials,
} from '../../src/auth/data-access/auth-token-store'
import { readConfig } from '../../src/config/data-access/config-store'
import { cleanupTempConfigHomes, createTempConfigHome, getTempConfigPath } from '../config/config-test-utils'

afterEach(() => {
  cleanupTempConfigHomes()
})

describe('auth token store', () => {
  test('stores API key auth fields while preserving unrelated profile fields', () => {
    const configPath = getTempConfigPath(createTempConfigHome())

    writeFileSync(
      configPath,
      JSON.stringify(
        {
          activeProfile: 'default',
          profiles: {
            default: {
              apiUrl: 'https://api.example.com',
              token: 'legacy-token',
            },
          },
        },
        null,
        2,
      ),
    )

    setStoredAuthCredentials(
      {
        apiKey: 'tg_cli_secret',
        apiKeyId: 'key-id',
        apiKeyName: 'Tokengator CLI on host',
        apiUrl: 'https://api.example.com',
        authenticatedAt: '2026-04-26T00:00:00.000Z',
        userId: 'user-1',
        username: 'alice',
      },
      { configPath },
    )

    expect(getStoredAuthCredentials({ configPath })).toEqual({
      apiKey: 'tg_cli_secret',
      apiKeyId: 'key-id',
      apiKeyName: 'Tokengator CLI on host',
      apiUrl: 'https://api.example.com',
      authenticatedAt: '2026-04-26T00:00:00.000Z',
      profile: 'default',
      userId: 'user-1',
      username: 'alice',
    })
    expect(readConfig(configPath).profiles.default?.token).toBe('legacy-token')
  })

  test('returns authenticated headers from the stored API key', () => {
    const configPath = getTempConfigPath(createTempConfigHome())

    writeFileSync(
      configPath,
      JSON.stringify({
        activeProfile: 'default',
        profiles: {
          default: {
            apiKey: 'tg_cli_secret',
            apiUrl: 'https://api.example.com',
          },
        },
      }),
    )

    expect(getAuthenticatedHeaders({ configPath }).get('x-api-key')).toBe('tg_cli_secret')
  })

  test('clears only auth fields on logout', () => {
    const configPath = getTempConfigPath(createTempConfigHome())

    writeFileSync(
      configPath,
      JSON.stringify(
        {
          activeProfile: 'default',
          profiles: {
            default: {
              apiKey: 'tg_cli_secret',
              apiKeyId: 'key-id',
              apiKeyName: 'Tokengator CLI on host',
              apiUrl: 'https://api.example.com',
              authenticatedAt: '2026-04-26T00:00:00.000Z',
              token: 'legacy-token',
              userId: 'user-1',
              username: 'alice',
            },
          },
        },
        null,
        2,
      ),
    )

    clearStoredAuthCredentials({ configPath })

    expect(readConfig(configPath)).toEqual({
      activeProfile: 'default',
      profiles: {
        default: {
          apiUrl: 'https://api.example.com',
          token: 'legacy-token',
        },
      },
    })
  })
})

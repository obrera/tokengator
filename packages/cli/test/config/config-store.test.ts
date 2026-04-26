import { afterEach, describe, expect, test } from 'bun:test'
import { readFileSync, writeFileSync } from 'node:fs'

import {
  createProfile,
  deleteProfile,
  getApiUrl,
  getConfigPath,
  listProfileSummaries,
  readConfig,
  setApiUrl,
  useProfile,
} from '../../src/index'
import { cleanupTempConfigHomes, createTempConfigHome, getTempConfigPath } from './config-test-utils'

afterEach(() => {
  cleanupTempConfigHomes()
})

describe('config path resolution', () => {
  test('uses TOKENGATOR_CONFIG_HOME when provided', () => {
    const configHome = createTempConfigHome()

    expect(getConfigPath({ TOKENGATOR_CONFIG_HOME: configHome })).toBe(getTempConfigPath(configHome))
  })
})

describe('config storage', () => {
  test('returns the default empty config when the config file is missing', () => {
    expect(readConfig(getTempConfigPath(createTempConfigHome()))).toEqual({
      activeProfile: 'default',
      profiles: {},
    })
  })

  test('tolerates legacy stored values without blocking reads', () => {
    const configPath = getTempConfigPath(createTempConfigHome())

    writeFileSync(
      configPath,
      JSON.stringify(
        {
          activeProfile: 'Bad Name',
          profiles: {
            '': {
              apiUrl: 'https://empty-name.example.com',
            },
            'bad-shape': {
              apiUrl: 123,
            },
            'Bad Name': {
              apiUrl: 'ftp://example.com',
            },
            ok: {
              apiUrl: 'https://api.example.com',
            },
          },
        },
        null,
        2,
      ),
    )

    expect(readConfig(configPath)).toEqual({
      activeProfile: 'Bad Name',
      profiles: {
        'Bad Name': {
          apiUrl: 'ftp://example.com',
        },
        ok: {
          apiUrl: 'https://api.example.com',
        },
      },
    })
  })

  test('trims stored profile names when reading config', () => {
    const configPath = getTempConfigPath(createTempConfigHome())

    writeFileSync(
      configPath,
      JSON.stringify(
        {
          activeProfile: ' dev ',
          profiles: {
            ' dev ': {
              apiUrl: ' https://dev.example.com ',
            },
            prod: {
              apiUrl: 'https://prod.example.com',
            },
          },
        },
        null,
        2,
      ),
    )

    expect(readConfig(configPath)).toEqual({
      activeProfile: 'dev',
      profiles: {
        dev: {
          apiUrl: 'https://dev.example.com',
        },
        prod: {
          apiUrl: 'https://prod.example.com',
        },
      },
    })
  })

  test('sets and reads the default profile API URL', () => {
    const configPath = getTempConfigPath(createTempConfigHome())

    setApiUrl('https://api.example.com', { configPath })

    expect(getApiUrl({ configPath })).toBe('https://api.example.com')
    expect(readFileSync(configPath, 'utf8')).toBe(`{
  "activeProfile": "default",
  "profiles": {
    "default": {
      "apiUrl": "https://api.example.com"
    }
  }
}
`)
  })

  test('preserves unknown profile fields when writing sorted config', () => {
    const configPath = getTempConfigPath(createTempConfigHome())

    writeFileSync(
      configPath,
      JSON.stringify(
        {
          activeProfile: 'default',
          profiles: {
            default: {
              apiUrl: 'https://api.example.com',
              token: 'secret',
            },
          },
        },
        null,
        2,
      ),
    )

    setApiUrl('https://api.example.com', { configPath })

    expect(readConfig(configPath)).toEqual({
      activeProfile: 'default',
      profiles: {
        default: {
          apiUrl: 'https://api.example.com',
          token: 'secret',
        },
      },
    })
  })

  test('creates, lists, activates, and deletes profiles alphabetically', () => {
    const configPath = getTempConfigPath(createTempConfigHome())

    createProfile('prod', 'https://prod.example.com', { configPath })
    createProfile('dev', 'http://localhost:3000', { configPath })

    expect(listProfileSummaries(readConfig(configPath))).toEqual([
      {
        active: '',
        apiUrl: 'http://localhost:3000',
        profile: 'dev',
      },
      {
        active: 'yes',
        apiUrl: 'https://prod.example.com',
        profile: 'prod',
      },
    ])

    useProfile('dev', { configPath })
    deleteProfile('prod', { configPath })

    expect(readConfig(configPath)).toEqual({
      activeProfile: 'dev',
      profiles: {
        dev: {
          apiUrl: 'http://localhost:3000',
        },
      },
    })
  })

  test('rejects conflicting config changes', () => {
    const configPath = getTempConfigPath(createTempConfigHome())

    createProfile('dev', 'https://dev.example.com', { configPath })

    expect(() => createProfile('dev', 'https://dev.example.com', { configPath })).toThrow('already exists')
    expect(() => deleteProfile('dev', { configPath })).toThrow('Cannot delete active profile')
    expect(() => getApiUrl({ configPath, profile: 'missing' })).toThrow('Profile "missing" does not exist.')
  })
})

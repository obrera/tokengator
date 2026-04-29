import { describe, expect, test } from 'bun:test'

const API_ENV_KEYS = [
  'API_PORT',
  'API_URL',
  'BETTER_AUTH_SECRET',
  'BETTER_AUTH_SOLANA_SIGN_IN_ENABLED',
  'CORS_ORIGINS',
  'DATABASE_AUTH_TOKEN',
  'DATABASE_URL',
  'DISCORD_ADMIN_IDS',
  'DISCORD_BOT_START',
  'DISCORD_BOT_TOKEN',
  'DISCORD_CLIENT_ID',
  'DISCORD_CLIENT_SECRET',
  'DISCORD_GUILD_ID',
  'HELIUS_API_KEY',
  'HELIUS_CLUSTER',
  'LOG_DEBUG_CATEGORIES',
  'LOG_JSON',
  'MAGIC_EDEN_API_KEY',
  'MAGIC_EDEN_LISTING_SECRET',
  'NODE_ENV',
  'PORT',
  'SCHEDULER_START',
  'SOLANA_ADMIN_ADDRESSES',
  'SOLANA_CLUSTER',
  'SOLANA_ENDPOINT_PUBLIC',
  'WEB_URL',
] as const

function withApiEnv(overrides: Partial<Record<(typeof API_ENV_KEYS)[number], string | undefined>> = {}) {
  const previousEnv = new Map<string, string | undefined>()

  for (const key of API_ENV_KEYS) {
    previousEnv.set(key, process.env[key])
  }

  Object.assign(process.env, {
    API_PORT: '4200',
    API_URL: 'http://127.0.0.1:3000',
    BETTER_AUTH_SECRET: '12345678901234567890123456789012',
    BETTER_AUTH_SOLANA_SIGN_IN_ENABLED: 'true',
    CORS_ORIGINS: 'http://127.0.0.1:3001',
    DATABASE_AUTH_TOKEN: 'test-token',
    DATABASE_URL: 'file:///tmp/tokengator-env-test.sqlite',
    DISCORD_ADMIN_IDS: '',
    DISCORD_BOT_TOKEN: 'discord-bot-token',
    DISCORD_CLIENT_ID: 'discord-client-id',
    DISCORD_CLIENT_SECRET: 'discord-client-secret',
    HELIUS_API_KEY: 'helius-api-key',
    HELIUS_CLUSTER: 'devnet',
    LOG_DEBUG_CATEGORIES: '',
    NODE_ENV: 'test',
    SOLANA_ADMIN_ADDRESSES: '',
    SOLANA_CLUSTER: 'devnet',
    SOLANA_ENDPOINT_PUBLIC: 'https://api.devnet.solana.com',
  })

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[key]
      continue
    }

    process.env[key] = value
  }

  return () => {
    for (const key of API_ENV_KEYS) {
      const previousValue = previousEnv.get(key)

      if (previousValue === undefined) {
        delete process.env[key]
        continue
      }

      process.env[key] = previousValue
    }
  }
}

describe('api env', () => {
  test('exposes API_PORT from the shared API env schema', async () => {
    const restoreEnv = withApiEnv()

    try {
      const { env } = await import(`@tokengator/env/api?test=${Date.now()}-app-api-port`)

      expect(env.API_PORT).toBe(4200)
    } finally {
      restoreEnv()
    }
  })

  test('keeps MAGIC_EDEN_API_KEY and MAGIC_EDEN_LISTING_SECRET optional in the app env schema', async () => {
    const restoreEnv = withApiEnv({
      MAGIC_EDEN_API_KEY: undefined,
      MAGIC_EDEN_LISTING_SECRET: undefined,
    })

    try {
      const { env } = await import(`@tokengator/env/api?test=${Date.now()}-app-magic-eden-optional`)

      expect(env.MAGIC_EDEN_API_KEY).toBeUndefined()
      expect(env.MAGIC_EDEN_LISTING_SECRET).toBeUndefined()
    } finally {
      restoreEnv()
    }
  })
})

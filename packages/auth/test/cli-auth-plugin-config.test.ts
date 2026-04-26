import { afterEach, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const AUTH_PACKAGE_DIR = resolve(import.meta.dir, '..')
const DB_PACKAGE_DIR = resolve(import.meta.dir, '..', '..', 'db')
const tempDirectories: string[] = []

function createDatabaseUrl() {
  const tempDir = mkdtempSync(resolve(tmpdir(), 'tokengator-auth-cli-tests-'))

  tempDirectories.push(tempDir)

  return pathToFileURL(resolve(tempDir, 'cli-auth.sqlite')).toString()
}

function createTestEnv(databaseUrl: string) {
  return {
    ...process.env,
    API_URL: 'http://127.0.0.1:3000',
    BETTER_AUTH_SECRET: '12345678901234567890123456789012',
    BETTER_AUTH_SOLANA_SIGN_IN_ENABLED: 'true',
    CORS_ORIGINS: 'http://127.0.0.1:3001',
    DATABASE_AUTH_TOKEN: 'test-token',
    DATABASE_URL: databaseUrl,
    DISCORD_BOT_TOKEN: 'discord-bot-token',
    DISCORD_CLIENT_ID: 'discord-client-id',
    DISCORD_CLIENT_SECRET: 'discord-client-secret',
    HELIUS_API_KEY: 'helius-api-key',
    HELIUS_CLUSTER: 'devnet',
    NODE_ENV: 'test',
    SOLANA_CLUSTER: 'devnet',
    SOLANA_ENDPOINT_PUBLIC: 'https://api.devnet.solana.com',
    WEB_URL: 'http://127.0.0.1:3001',
  }
}

function decodeOutput(buffer: Uint8Array | undefined) {
  return buffer ? Buffer.from(buffer).toString('utf8').trim() : ''
}

function syncDatabase(databaseUrl: string) {
  const result = Bun.spawnSync({
    cmd: ['bun', 'run', 'db:push', '--force'],
    cwd: DB_PACKAGE_DIR,
    env: createTestEnv(databaseUrl),
    stderr: 'pipe',
    stdout: 'pipe',
  })

  if (result.exitCode !== 0) {
    throw new Error(`Failed to sync the test database.\n${decodeOutput(result.stdout)}\n${decodeOutput(result.stderr)}`)
  }
}

function runIsolatedAuthCheck(databaseUrl: string) {
  const script = `
    const { sql } = await import('drizzle-orm')
    const { db } = await import('@tokengator/db')
    const authSchema = await import('@tokengator/db/schema/auth')
    const { auth } = await import(${JSON.stringify(new URL('../src/index.ts', import.meta.url).href)})
    const now = new Date('2026-04-26T00:00:00.000Z')

    await db.delete(authSchema.apikey).where(sql\`1 = 1\`)
    await db.delete(authSchema.deviceCode).where(sql\`1 = 1\`)
    await db.delete(authSchema.user).where(sql\`1 = 1\`)
    await db.insert(authSchema.user).values({
      createdAt: now,
      email: 'alice@example.com',
      emailVerified: true,
      id: 'user-1',
      image: null,
      name: 'Alice',
      role: 'user',
      updatedAt: now,
      username: 'alice',
    })

    const longApiKeyName = 'Tokengator CLI: default on long-workstation.example'
    const apiKey = await auth.api.createApiKey({
      body: {
        configId: 'cli',
        expiresIn: 7776000,
        name: longApiKeyName,
        userId: 'user-1',
      },
    })
    const defaultApiKey = await auth.api.createApiKey({
      body: {
        configId: 'cli',
        name: 'Tokengator CLI default expiry',
        userId: 'user-1',
      },
    })
    const session = await auth.api.getSession({
      headers: new Headers({
        'x-api-key': apiKey.key,
      }),
    })
    let invalidRejected = false

    try {
      await auth.api.getSession({
        headers: new Headers({
          'x-api-key': \`tg_cli_\${'x'.repeat(80)}\`,
        }),
      })
    } catch {
      invalidRejected = true
    }

    console.log(JSON.stringify({
      invalidRejected,
      expiresAt: apiKey.expiresAt?.toISOString() ?? null,
      defaultExpiresAt: defaultApiKey.expiresAt?.toISOString() ?? null,
      keyPrefixValid: apiKey.key.startsWith('tg_cli_'),
      name: apiKey.name,
      nameLength: longApiKeyName.length,
      referenceId: apiKey.referenceId,
      sessionUserId: session?.user.id ?? null,
    }))
  `
  const result = Bun.spawnSync({
    cmd: ['bun', '--eval', script],
    cwd: AUTH_PACKAGE_DIR,
    env: createTestEnv(databaseUrl),
    stderr: 'pipe',
    stdout: 'pipe',
  })

  if (result.exitCode !== 0) {
    throw new Error(`Isolated auth check failed.\n${decodeOutput(result.stdout)}\n${decodeOutput(result.stderr)}`)
  }

  return JSON.parse(decodeOutput(result.stdout)) as {
    defaultExpiresAt: string | null
    expiresAt: string | null
    invalidRejected: boolean
    keyPrefixValid: boolean
    name: string | null
    nameLength: number
    referenceId: string
    sessionUserId: string | null
  }
}

afterEach(() => {
  for (const tempDirectory of tempDirectories) {
    rmSync(tempDirectory, {
      force: true,
      recursive: true,
    })
  }

  tempDirectories.length = 0
})

describe('CLI API key auth config', () => {
  test('creates a user-owned CLI API key and resolves a session from x-api-key', () => {
    const beforeCheck = Date.now()
    const databaseUrl = createDatabaseUrl()

    syncDatabase(databaseUrl)

    const result = runIsolatedAuthCheck(databaseUrl)
    const afterCheck = Date.now()
    const ninetyDaysMs = 1000 * 60 * 60 * 24 * 90

    expect(result).toMatchObject({
      invalidRejected: true,
      keyPrefixValid: true,
      name: 'Tokengator CLI: default on long-workstation.example',
      referenceId: 'user-1',
      sessionUserId: 'user-1',
    })
    expect(typeof result.expiresAt).toBe('string')
    expect(result.defaultExpiresAt).not.toBeNull()
    expect(result.nameLength).toBeGreaterThan(32)
    expect(new Date(result.defaultExpiresAt ?? '').getTime()).toBeGreaterThanOrEqual(beforeCheck + ninetyDaysMs - 5000)
    expect(new Date(result.defaultExpiresAt ?? '').getTime()).toBeLessThanOrEqual(afterCheck + ninetyDaysMs + 5000)
  })
})

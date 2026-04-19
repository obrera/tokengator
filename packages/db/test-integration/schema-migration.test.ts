import { afterAll, beforeAll, describe, expect, test } from 'bun:test'
import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { resolve } from 'node:path'
import { pathToFileURL } from 'node:url'

const DB_PACKAGE_DIR = resolve(import.meta.dir, '..')

let tempDir = ''

function createDatabaseUrl(filename: string) {
  return pathToFileURL(resolve(tempDir, filename)).toString()
}

function decodeOutput(buffer: Uint8Array | undefined) {
  return buffer ? Buffer.from(buffer).toString('utf8').trim() : ''
}

function syncDatabase(databaseUrl: string) {
  const result = Bun.spawnSync({
    cmd: ['bun', 'run', 'db:push', '--force'],
    cwd: DB_PACKAGE_DIR,
    env: {
      ...process.env,
      DATABASE_AUTH_TOKEN: 'test-token',
      DATABASE_URL: databaseUrl,
    },
    stderr: 'pipe',
    stdout: 'pipe',
  })

  if (result.exitCode !== 0) {
    throw new Error(`Failed to sync the test database.\n${decodeOutput(result.stdout)}\n${decodeOutput(result.stderr)}`)
  }
}

async function createClient(databaseUrl: string) {
  const { createClient: createLibsqlClient } = await import('@libsql/client')

  return createLibsqlClient({
    authToken: 'test-token',
    url: databaseUrl,
  })
}

beforeAll(() => {
  tempDir = mkdtempSync(resolve(tmpdir(), 'tokengator-db-migration-'))
})

afterAll(() => {
  if (tempDir) {
    rmSync(tempDir, {
      force: true,
      recursive: true,
    })
  }
})

describe('db:push', () => {
  test('backfills resolver kind for existing asset tables before applying the schema update', async () => {
    const databaseUrl = createDatabaseUrl('legacy.sqlite')
    const client = await createClient(databaseUrl)

    try {
      await client.execute(`
        CREATE TABLE asset_group (
          address text NOT NULL,
          created_at integer NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)),
          decimals integer NOT NULL DEFAULT 0,
          enabled integer NOT NULL DEFAULT true,
          facet_totals text,
          id text PRIMARY KEY NOT NULL,
          image_url text,
          indexing_started_at integer,
          label text NOT NULL,
          symbol text,
          type text NOT NULL,
          updated_at integer NOT NULL DEFAULT (cast(unixepoch('subsecond') * 1000 as integer))
        )
      `)
      await client.execute(`
        CREATE TABLE asset_group_index_run (
          asset_group_id text NOT NULL,
          deleted_count integer NOT NULL DEFAULT 0,
          error_message text,
          error_payload text,
          finished_at integer,
          id text PRIMARY KEY NOT NULL,
          inserted_count integer NOT NULL DEFAULT 0,
          pages_processed integer NOT NULL DEFAULT 0,
          started_at integer NOT NULL,
          status text NOT NULL,
          total_count integer NOT NULL DEFAULT 0,
          trigger_source text NOT NULL,
          updated_count integer NOT NULL DEFAULT 0
        )
      `)
      await client.execute(`
        CREATE TABLE asset (
          address text NOT NULL,
          amount text NOT NULL,
          asset_group_id text NOT NULL,
          first_seen_at integer NOT NULL,
          id text PRIMARY KEY NOT NULL,
          indexed_asset_id text NOT NULL,
          indexed_at integer NOT NULL,
          last_seen_at integer NOT NULL,
          metadata text,
          metadata_description text,
          metadata_image_url text,
          metadata_json text,
          metadata_json_url text,
          metadata_name text,
          metadata_program_account text,
          metadata_symbol text,
          owner text NOT NULL,
          page integer NOT NULL,
          raw text,
          resolver_id text NOT NULL
        )
      `)
      await client.execute(`
        INSERT INTO asset_group (address, id, label, type)
        VALUES
          ('collection-a', 'group-collection', 'Collection A', 'collection'),
          ('mint-a', 'group-mint', 'Mint A', 'mint')
      `)
      await client.execute(`
        INSERT INTO asset_group_index_run (asset_group_id, id, started_at, status, trigger_source)
        VALUES
          ('group-collection', 'run-collection', 1, 'succeeded', 'manual'),
          ('group-mint', 'run-mint', 2, 'succeeded', 'scheduled'),
          ('missing-group', 'run-orphan', 3, 'failed', 'manual')
      `)
      await client.execute(`
        INSERT INTO asset (address, amount, asset_group_id, first_seen_at, id, indexed_asset_id, indexed_at, last_seen_at, owner, page, resolver_id)
        VALUES
          ('asset-collection', '1', 'group-collection', 1, 'asset-row-collection', 'indexed-collection', 1, 1, 'owner-a', 1, 'resolver-collection'),
          ('asset-mint', '10', 'group-mint', 2, 'asset-row-mint', 'indexed-mint', 2, 2, 'owner-b', 1, 'resolver-mint'),
          ('asset-orphan', '5', 'missing-group', 3, 'asset-row-orphan', 'indexed-orphan', 3, 3, 'owner-c', 1, 'resolver-orphan')
      `)

      syncDatabase(databaseUrl)

      const assetGroupRows = await client.execute(`
        SELECT id, resolver_kind AS resolverKind
        FROM asset_group
        ORDER BY id
      `)
      const assetGroupIndexRunRows = await client.execute(`
        SELECT id, resolver_kind AS resolverKind
        FROM asset_group_index_run
        ORDER BY id
      `)
      const assetRows = await client.execute(`
        SELECT id, resolver_kind AS resolverKind
        FROM asset
        ORDER BY id
      `)

      expect(
        assetGroupRows.rows.map((row) => ({
          id: String(row.id),
          resolverKind: String(row.resolverKind),
        })),
      ).toEqual([
        {
          id: 'group-collection',
          resolverKind: 'helius-collection-assets',
        },
        {
          id: 'group-mint',
          resolverKind: 'helius-token-accounts',
        },
      ])
      expect(
        assetGroupIndexRunRows.rows.map((row) => ({
          id: String(row.id),
          resolverKind: String(row.resolverKind),
        })),
      ).toEqual([
        {
          id: 'run-collection',
          resolverKind: 'helius-collection-assets',
        },
        {
          id: 'run-mint',
          resolverKind: 'helius-token-accounts',
        },
      ])
      expect(
        assetRows.rows.map((row) => ({
          id: String(row.id),
          resolverKind: String(row.resolverKind),
        })),
      ).toEqual([
        {
          id: 'asset-row-collection',
          resolverKind: 'helius-collection-assets',
        },
        {
          id: 'asset-row-mint',
          resolverKind: 'helius-token-accounts',
        },
      ])
    } finally {
      await client.close()
    }
  })
})

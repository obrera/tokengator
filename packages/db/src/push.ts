import { createClient, type Client } from '@libsql/client'
import dotenv from 'dotenv'
import { resolve } from 'node:path'

const API_ENV_PATH = resolve(import.meta.dir, '..', '..', '..', 'apps', 'api', '.env')
const DB_PACKAGE_DIR = resolve(import.meta.dir, '..')
const RESOLVER_KIND_COLUMN = 'resolver_kind'
const FATAL_DRIZZLE_OUTPUT_PATTERNS = [/interactive prompts require a tty terminal/i, /sqlite error/i, /sqlite_/i]

dotenv.config({
  path: API_ENV_PATH,
  quiet: true,
})

function decodeOutput(buffer: Uint8Array | undefined) {
  return buffer ? Buffer.from(buffer).toString('utf8') : ''
}

function hasFatalDrizzleOutput(output: string) {
  return FATAL_DRIZZLE_OUTPUT_PATTERNS.some((pattern) => pattern.test(output))
}

async function deleteOrphanedAssetGroupRows(client: Client, tableName: 'asset' | 'asset_group_index_run') {
  await client.execute(`
    DELETE FROM ${tableName}
    WHERE asset_group_id NOT IN (
      SELECT id
      FROM asset_group
    )
  `)
}

async function ensureResolverKindBackfill(client: Client) {
  if (await tableExists(client, 'asset_group')) {
    await ensureColumn(client, 'asset_group', RESOLVER_KIND_COLUMN)
    await client.execute(`
      UPDATE asset_group
      SET resolver_kind = CASE type
        WHEN 'collection' THEN 'helius-collection-assets'
        ELSE 'helius-token-accounts'
      END
      WHERE resolver_kind IS NULL
    `)
  }

  if (await tableExists(client, 'asset_group_index_run')) {
    await deleteOrphanedAssetGroupRows(client, 'asset_group_index_run')
    await ensureColumn(client, 'asset_group_index_run', RESOLVER_KIND_COLUMN)
    await client.execute(`
      UPDATE asset_group_index_run
      SET resolver_kind = (
        SELECT asset_group.resolver_kind
        FROM asset_group
        WHERE asset_group.id = asset_group_index_run.asset_group_id
      )
      WHERE resolver_kind IS NULL
    `)
  }

  if (await tableExists(client, 'asset')) {
    await deleteOrphanedAssetGroupRows(client, 'asset')
    await ensureColumn(client, 'asset', RESOLVER_KIND_COLUMN)
    await client.execute(`
      UPDATE asset
      SET resolver_kind = (
        SELECT asset_group.resolver_kind
        FROM asset_group
        WHERE asset_group.id = asset.asset_group_id
      )
      WHERE resolver_kind IS NULL
    `)
  }
}

async function ensureColumn(client: Client, tableName: string, columnName: string) {
  const columns = await getColumnNames(client, tableName)

  if (columns.includes(columnName)) {
    return
  }

  await client.execute(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} text`)
}

async function getColumnNames(client: Client, tableName: string) {
  const result = await client.execute(`PRAGMA table_info(${tableName})`)

  return result.rows
    .map((row) => row.name)
    .flatMap((name) => (typeof name === 'string' && name.trim() ? [name] : []))
    .sort((left, right) => left.localeCompare(right))
}

async function tableExists(client: Client, tableName: string) {
  const result = await client.execute({
    args: [tableName],
    sql: `SELECT 1 AS present
      FROM sqlite_master
      WHERE type = 'table' AND name = ?
      LIMIT 1`,
  })

  return result.rows.length > 0
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL?.trim()

  if (!databaseUrl) {
    throw new Error('DATABASE_URL must be set before running db:push.')
  }

  const client = createClient({
    authToken: process.env.DATABASE_AUTH_TOKEN?.trim() || undefined,
    url: databaseUrl,
  })

  await ensureResolverKindBackfill(client)
  await client.close()

  const result = Bun.spawnSync({
    cmd: [process.execPath, 'x', 'drizzle-kit', 'push', ...process.argv.slice(2)],
    cwd: DB_PACKAGE_DIR,
    env: process.env,
    stderr: 'pipe',
    stdout: 'pipe',
  })

  const stdout = decodeOutput(result.stdout)
  const stderr = decodeOutput(result.stderr)
  const combinedOutput = `${stdout}\n${stderr}`

  process.stdout.write(stdout)
  process.stderr.write(stderr)

  if (result.exitCode === null) {
    process.stderr.write(`drizzle-kit push terminated by signal ${result.signalCode ?? 'unknown'}.\n`)
    process.exit(1)
  }

  if (result.exitCode !== 0) {
    process.exit(result.exitCode)
  }

  if (hasFatalDrizzleOutput(combinedOutput)) {
    process.stderr.write('\ndb:push reported a database error despite exiting 0.\n')
    process.exit(1)
  }
}

await main()

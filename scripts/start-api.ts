import net from 'node:net'
import { setTimeout as sleep } from 'node:timers/promises'

const DEFAULT_WAIT_TIMEOUT_MS = 30_000
const DB_PUSH_RETRY_COUNT = 5
const DB_PUSH_RETRY_DELAY_MS = 2_000

function isEnabled(value: string | undefined, defaultValue: boolean) {
  if (value === undefined) {
    return defaultValue
  }

  const normalizedValue = value.trim().toLowerCase()

  return normalizedValue === '1' || normalizedValue === 'true' || normalizedValue === 'yes' || normalizedValue === 'on'
}

function getDatabaseAddress(databaseUrl: string) {
  try {
    const url = new URL(databaseUrl)

    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return
    }

    return {
      hostname: url.hostname,
      port: Number(url.port || (url.protocol === 'https:' ? '443' : '80')),
    }
  } catch {
    return
  }
}

async function isPortReachable(hostname: string, port: number) {
  return await new Promise<boolean>((resolve) => {
    const socket = net.createConnection({
      host: hostname,
      port,
    })

    const finish = (reachable: boolean) => {
      socket.destroy()
      resolve(reachable)
    }

    socket.once('connect', () => finish(true))
    socket.once('error', () => finish(false))
    socket.setTimeout(1_000, () => finish(false))
  })
}

async function waitForDatabase(databaseUrl: string) {
  const address = getDatabaseAddress(databaseUrl)

  if (!address) {
    return
  }

  const startedAt = Date.now()

  while (Date.now() - startedAt < DEFAULT_WAIT_TIMEOUT_MS) {
    if (await isPortReachable(address.hostname, address.port)) {
      return
    }

    await sleep(500)
  }

  throw new Error(`Timed out waiting for the database at ${address.hostname}:${address.port}.`)
}

async function runCommand(command: string[], label: string) {
  const processResult = Bun.spawn({
    cmd: command,
    cwd: import.meta.dir + '/..',
    env: process.env,
    stderr: 'inherit',
    stdin: 'inherit',
    stdout: 'inherit',
  })

  const exitCode = await processResult.exited

  if (exitCode !== 0) {
    throw new Error(`${label} failed with exit code ${exitCode}.`)
  }
}

async function runDatabasePush() {
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= DB_PUSH_RETRY_COUNT; attempt++) {
    try {
      await runCommand(['bun', 'run', '--cwd', 'packages/db', 'db:push'], 'bun run --cwd packages/db db:push')
      return
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt === DB_PUSH_RETRY_COUNT) {
        break
      }

      await sleep(DB_PUSH_RETRY_DELAY_MS)
    }
  }

  throw lastError ?? new Error('Database push failed.')
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL

  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required.')
  }

  if (isEnabled(process.env.WAIT_FOR_DATABASE, true)) {
    await waitForDatabase(databaseUrl)
  }

  if (isEnabled(process.env.DB_PUSH_ON_START, false)) {
    await runDatabasePush()
  }

  await runCommand(['bun', 'run', '--cwd', 'apps/api', 'start'], 'bun run --cwd apps/api start')
}

await main()

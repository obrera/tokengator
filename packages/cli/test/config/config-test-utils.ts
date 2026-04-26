import { mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

const tempDirectories: string[] = []

type RunCliOptions = {
  env?: NodeJS.ProcessEnv
}

export function cleanupTempConfigHomes(): void {
  for (const directory of tempDirectories) {
    try {
      rmSync(directory, { force: true, recursive: true })
    } catch {
      // Best-effort cleanup should not block later temp directories.
    }
  }

  tempDirectories.length = 0
}

export function createTempConfigHome(): string {
  const directory = mkdtempSync(join(tmpdir(), 'tokengator-cli-test-'))

  tempDirectories.push(directory)

  return directory
}

export function decodeOutput(output: ArrayBuffer | Uint8Array): string {
  return Buffer.from(output instanceof ArrayBuffer ? new Uint8Array(output) : output).toString('utf8')
}

export function getTempConfigPath(configHome: string): string {
  return join(configHome, 'config.json')
}

export function runCli(args: string[], configHome: string, options: RunCliOptions = {}) {
  return Bun.spawnSync({
    cmd: ['bun', './src/cli.ts', ...args],
    cwd: join(import.meta.dir, '../..'),
    env: {
      ...process.env,
      ...options.env,
      NO_COLOR: '1',
      TOKENGATOR_CONFIG_HOME: configHome,
    },
    stderr: 'pipe',
    stdout: 'pipe',
    timeout: 5000,
  })
}

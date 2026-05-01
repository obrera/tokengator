import { afterEach, describe, expect, test } from 'bun:test'

import { cleanupTempConfigHomes, createTempConfigHome, decodeOutput, runCli } from '../config/config-test-utils'

afterEach(() => {
  cleanupTempConfigHomes()
})

describe('communities cli commands', () => {
  for (const subcommand of ['create', 'delete', 'get', 'list', 'owner-candidates', 'update'] as const) {
    test(`registers communities ${subcommand}`, () => {
      const result = runCli(['communities', subcommand, '--help'], createTempConfigHome())

      expect(result.exitCode).toBe(0)
      expect(decodeOutput(result.stdout)).toContain(`tokengator communities ${subcommand}`)
    })
  }

  test('registers common admin options', () => {
    const result = runCli(['communities', 'list', '--help'], createTempConfigHome())
    const output = decodeOutput(result.stdout)

    expect(result.exitCode).toBe(0)
    expect(output).toContain('--json')
    expect(output).toContain('--profile')
    expect(output).toContain('--verbose')
  })

  for (const subcommand of [
    ['discord', 'connect'],
    ['members', 'add'],
  ] as const) {
    test(`registers communities ${subcommand.join(' ')}`, () => {
      const result = runCli(['communities', ...subcommand, '--help'], createTempConfigHome())

      expect(result.exitCode).toBe(0)
      expect(decodeOutput(result.stdout)).toContain(`tokengator communities ${subcommand.join(' ')}`)
    })
  }
})

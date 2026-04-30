import { afterEach, describe, expect, test } from 'bun:test'

import { cleanupTempConfigHomes, createTempConfigHome, decodeOutput, runCli } from '../config/config-test-utils'

afterEach(() => {
  cleanupTempConfigHomes()
})

describe('asset-groups cli commands', () => {
  for (const subcommand of ['create', 'delete', 'get', 'index', 'index-runs', 'list', 'lookup', 'update'] as const) {
    test(`registers asset-groups ${subcommand}`, () => {
      const result = runCli(['asset-groups', subcommand, '--help'], createTempConfigHome())

      expect(result.exitCode).toBe(0)
      expect(decodeOutput(result.stdout)).toContain(`tokengator asset-groups ${subcommand}`)
    })
  }

  test('registers common admin options', () => {
    const result = runCli(['asset-groups', 'list', '--help'], createTempConfigHome())
    const output = decodeOutput(result.stdout)

    expect(result.exitCode).toBe(0)
    expect(output).toContain('--json')
    expect(output).toContain('--profile')
    expect(output).toContain('--verbose')
  })
})

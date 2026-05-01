import { afterEach, describe, expect, test } from 'bun:test'

import { cleanupTempConfigHomes, createTempConfigHome, decodeOutput, runCli } from '../config/config-test-utils'

afterEach(() => {
  cleanupTempConfigHomes()
})

describe('users cli commands', () => {
  for (const subcommand of ['create', 'get', 'link-discord', 'link-solana', 'list', 'update'] as const) {
    test(`registers users ${subcommand}`, () => {
      const result = runCli(['users', subcommand, '--help'], createTempConfigHome())

      expect(result.exitCode).toBe(0)
      expect(decodeOutput(result.stdout)).toContain(`tokengator users ${subcommand}`)
    })
  }

  test('registers common admin options', () => {
    const result = runCli(['users', 'list', '--help'], createTempConfigHome())
    const output = decodeOutput(result.stdout)

    expect(result.exitCode).toBe(0)
    expect(output).toContain('--json')
    expect(output).toContain('--profile')
    expect(output).toContain('--verbose')
  })

  test('rejects conflicting email verification flags', () => {
    const result = runCli(
      ['users', 'update', 'user-id', '--email-unverified', '--email-verified'],
      createTempConfigHome(),
    )

    expect(result.exitCode).not.toBe(0)
    expect(decodeOutput(result.stderr)).toContain('Use either --email-unverified or --email-verified, not both.')
  })
})

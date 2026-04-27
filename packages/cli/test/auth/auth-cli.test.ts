import { afterEach, describe, expect, test } from 'bun:test'

import { cleanupTempConfigHomes, createTempConfigHome, decodeOutput, runCli } from '../config/config-test-utils'

afterEach(() => {
  cleanupTempConfigHomes()
})

describe('auth cli commands', () => {
  for (const subcommand of ['login', 'logout', 'whoami'] as const) {
    test(`registers --verbose option on auth ${subcommand}`, () => {
      const result = runCli(['auth', subcommand, '--help'], createTempConfigHome())

      expect(result.exitCode).toBe(0)
      expect(decodeOutput(result.stdout)).toContain('--verbose')
    })
  }
})

import { afterEach, describe, expect, test } from 'bun:test'

import { cleanupTempConfigHomes, createTempConfigHome, decodeOutput, runCli } from '../config/config-test-utils'

afterEach(() => {
  cleanupTempConfigHomes()
})

describe('seed cli commands', () => {
  test('registers seed apply', () => {
    const result = runCli(['seed', 'apply', '--help'], createTempConfigHome())
    const output = decodeOutput(result.stdout)

    expect(result.exitCode).toBe(0)
    expect(output).toContain('tokengator seed apply')
    expect(output).toContain('--api-url')
    expect(output).toContain('--profile')
    expect(output).toContain('--verbose')
  })
})

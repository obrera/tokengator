import { afterEach, describe, expect, test } from 'bun:test'

import { cleanupTempConfigHomes, createTempConfigHome, decodeOutput, runCli } from '../config/config-test-utils'

afterEach(() => {
  cleanupTempConfigHomes()
})

describe('community-roles cli commands', () => {
  test('registers community-roles create', () => {
    const result = runCli(['community-roles', 'create', '--help'], createTempConfigHome())
    const output = decodeOutput(result.stdout)

    expect(result.exitCode).toBe(0)
    expect(output).toContain('tokengator community-roles create')
    expect(output).toContain('--condition')
    expect(output).toContain('--json')
    expect(output).toContain('--profile')
    expect(output).toContain('--verbose')
  })

  test('rejects community role create without conditions', () => {
    const result = runCli(
      [
        'community-roles',
        'create',
        '--match-mode',
        'all',
        '--name',
        'Holder',
        '--organization-id',
        'organization-id',
        '--slug',
        'holder',
      ],
      createTempConfigHome(),
    )

    expect(result.exitCode).not.toBe(0)
    expect(decodeOutput(result.stderr)).toContain("required option '--condition <condition>' not specified")
  })

  test('rejects over-specified condition strings', () => {
    const result = runCli(
      [
        'community-roles',
        'create',
        '--condition',
        'asset-group-id:1:2:3',
        '--match-mode',
        'all',
        '--name',
        'Holder',
        '--organization-id',
        'organization-id',
        '--slug',
        'holder',
      ],
      createTempConfigHome(),
    )

    expect(result.exitCode).not.toBe(0)
    expect(decodeOutput(result.stderr)).toContain('condition must be assetGroupId:minimumAmount[:maximumAmount].')
  })
})

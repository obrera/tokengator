import { afterEach, describe, expect, test } from 'bun:test'
import { join } from 'node:path'

import { TG_PROFILE_ENV } from '../../src/index'
import {
  cleanupTempConfigHomes,
  createTempConfigHome,
  decodeOutput,
  getTempConfigPath,
  runCli,
} from './config-test-utils'

afterEach(() => {
  cleanupTempConfigHomes()
})

describe('config cli commands', () => {
  test('shows help for bare invocation', () => {
    const result = runCli([], createTempConfigHome())

    expect(result.exitCode).toBe(0)
    expect(decodeOutput(result.stdout)).toContain('Usage: tokengator [options] [command]')
  })

  test('shows help for bare command groups', () => {
    let result = runCli(['config'], createTempConfigHome())
    expect(result.exitCode).toBe(0)
    expect(decodeOutput(result.stdout)).toContain('Usage: tokengator config [options] [command]')

    result = runCli(['config', 'profiles'], createTempConfigHome())
    expect(result.exitCode).toBe(0)
    expect(decodeOutput(result.stdout)).toContain('Usage: tokengator config profiles [options] [command]')
  })

  test('shows an onboarding prompt when config has not been initialized', () => {
    const result = runCli(['config', 'get'], createTempConfigHome())

    expect(result.exitCode).toBe(0)

    const output = decodeOutput(result.stdout)

    expect(output).toContain('No Tokengator config found.')
    expect(output).toContain('tokengator config init')
    expect(output).not.toContain('Active profile:')
  })

  test('collapses the home directory in human-facing config output', () => {
    const home = createTempConfigHome()
    const configHome = join(home, '.tokengator-cli-display-test')
    const result = runCli(['config', 'get'], configHome, { env: { HOME: home, USERPROFILE: home } })

    expect(result.exitCode).toBe(0)
    expect(decodeOutput(result.stdout)).toContain('Config path: ~/.tokengator-cli-display-test/config.json')
  })

  test('shows an empty profiles message instead of an empty table', () => {
    const result = runCli(['config', 'profiles', 'list'], createTempConfigHome())

    expect(result.exitCode).toBe(0)
    expect(decodeOutput(result.stdout)).toContain('No profiles configured.')
  })

  test('exits non-zero for invalid config values', () => {
    const result = runCli(['config', 'set', 'api-url', 'ftp://example.com'], createTempConfigHome())

    expect(result.exitCode).toBe(1)
    expect(decodeOutput(result.stderr)).toContain('API URL must use http or https.')
  })

  test('exits non-zero when reading an unset API URL', () => {
    const result = runCli(['config', 'get', 'api-url'], createTempConfigHome())

    expect(result.exitCode).toBe(1)
    expect(decodeOutput(result.stderr)).toContain('API URL is not set.')
  })

  test('exits non-zero when profile is used without a config key', () => {
    const result = runCli(['config', 'get', '--profile', 'dev'], createTempConfigHome())

    expect(result.exitCode).toBe(1)
    expect(decodeOutput(result.stderr)).toContain('--profile can only be used with "tokengator config get api-url".')
  })

  test('registers the interactive config init command', () => {
    const result = runCli(['config', 'init', '--help'], createTempConfigHome())

    expect(result.exitCode).toBe(0)
    expect(decodeOutput(result.stdout)).toContain('Interactively create or update local Tokengator config.')
  })

  test('sets, reads, and lists profile config from the command line', () => {
    const configHome = createTempConfigHome()

    let result = runCli(['config', 'set', 'api-url', 'https://api.example.com'], configHome)
    expect(result.exitCode).toBe(0)
    expect(decodeOutput(result.stdout)).toContain('Set api-url for profile "default".')

    result = runCli(['config', 'get', 'api-url'], configHome)
    expect(result.exitCode).toBe(0)
    expect(decodeOutput(result.stdout).trim()).toBe('https://api.example.com')

    result = runCli(['config', 'profiles', 'create', 'dev', '--api-url', 'http://localhost:3000'], configHome)
    expect(result.exitCode).toBe(0)

    result = runCli(['config', 'get'], configHome)
    expect(result.exitCode).toBe(0)

    const getOutput = decodeOutput(result.stdout)

    expect(getOutput).toContain(`Config path: ${getTempConfigPath(configHome)}`)
    expect(getOutput).toContain('Active profile: default')
    expect(getOutput).toContain('default')
    expect(getOutput).toContain('dev')
    expect(getOutput).toContain('https://api.example.com')
    expect(getOutput).toContain('http://localhost:3000')

    result = runCli(['config', 'profiles', 'list'], configHome)
    expect(result.exitCode).toBe(0)
    expect(decodeOutput(result.stdout)).toContain('profile')
  })

  test('uses TG_PROFILE for profile-aware config commands', () => {
    const configHome = createTempConfigHome()

    let result = runCli(['config', 'set', 'api-url', 'https://api.example.com'], configHome)
    expect(result.exitCode).toBe(0)

    result = runCli(['config', 'profiles', 'create', 'dev', '--api-url', 'http://localhost:3000'], configHome)
    expect(result.exitCode).toBe(0)

    result = runCli(['config', 'get', 'api-url'], configHome, { env: { [TG_PROFILE_ENV]: 'dev' } })
    expect(result.exitCode).toBe(0)
    expect(decodeOutput(result.stdout).trim()).toBe('http://localhost:3000')

    result = runCli(['config', 'get', 'api-url', '--profile', 'default'], configHome, {
      env: { [TG_PROFILE_ENV]: 'dev' },
    })
    expect(result.exitCode).toBe(0)
    expect(decodeOutput(result.stdout).trim()).toBe('https://api.example.com')
  })
})

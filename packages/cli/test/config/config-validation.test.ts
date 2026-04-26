import { describe, expect, test } from 'bun:test'

import { validateApiUrl, validateProfileName } from '../../src/index'

describe('config validation', () => {
  test('validates and trims API URLs', () => {
    expect(validateApiUrl(' https://api.example.com ')).toBe('https://api.example.com')
    expect(validateApiUrl('http://localhost:3000')).toBe('http://localhost:3000')
  })

  test('rejects invalid API URLs', () => {
    expect(() => validateApiUrl('')).toThrow('API URL is required.')
    expect(() => validateApiUrl('ftp://example.com')).toThrow('API URL must use http or https.')
    expect(() => validateApiUrl('not a url')).toThrow('Invalid API URL "not a url".')
  })

  test('validates and trims profile names', () => {
    expect(validateProfileName(' default ')).toBe('default')
    expect(validateProfileName('dev-1')).toBe('dev-1')
  })

  test('rejects invalid profile names', () => {
    expect(() => validateProfileName('')).toThrow('Profile name is required.')
    expect(() => validateProfileName('   ')).toThrow('Profile name is required.')
    expect(() => validateProfileName('Bad Name')).toThrow('Use lowercase letters, numbers, and hyphens.')
    expect(() => validateProfileName('-dev')).toThrow('Invalid profile name')
  })
})

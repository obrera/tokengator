import { describe, expect, test } from 'bun:test'

import { getAuthLocalRedirect, validateAuthLocalRedirectSearch } from '../src/features/auth/util/auth-local-redirect'

describe('auth local redirect validation', () => {
  test('accepts local redirects', () => {
    expect(getAuthLocalRedirect('/cli/authorize?user_code=ABCD1234')).toBe('/cli/authorize?user_code=ABCD1234')
    expect(validateAuthLocalRedirectSearch({ redirect: ' /profile ' })).toEqual({
      redirect: '/profile',
    })
  })

  test('rejects external and normalized protocol-relative redirects', () => {
    expect(getAuthLocalRedirect('https://evil.example.com')).toBeUndefined()
    expect(getAuthLocalRedirect('//evil.example.com')).toBeUndefined()
    expect(getAuthLocalRedirect('/\\evil.example.com')).toBeUndefined()
    expect(getAuthLocalRedirect('/%2fevil.example.com')).toBeUndefined()
    expect(getAuthLocalRedirect('/%5cevil.example.com')).toBeUndefined()
    expect(getAuthLocalRedirect('/safe%2fpath')).toBeUndefined()
  })
})

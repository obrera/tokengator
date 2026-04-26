import { describe, expect, test } from 'bun:test'

import { AuthError, type AuthDeviceCode, type AuthDeviceToken } from '../../src/auth/data-access/auth-api-client'
import { runDeviceAuthorizationFlow } from '../../src/auth/data-access/auth-device-flow'

const deviceCode = {
  device_code: 'device-code',
  expires_in: 900,
  interval: 1,
  user_code: 'ABCD1234',
  verification_uri: 'https://app.example.com/cli/authorize',
  verification_uri_complete: 'https://app.example.com/cli/authorize?user_code=ABCD1234',
} satisfies AuthDeviceCode

const deviceToken = {
  access_token: 'access-token',
  expires_in: 604800,
  scope: 'cli',
  token_type: 'Bearer',
} satisfies AuthDeviceToken

describe('auth device flow', () => {
  test('continues polling while authorization is pending', async () => {
    const sleeps: number[] = []
    let tokenRequests = 0

    const token = await runDeviceAuthorizationFlow({
      apiUrl: 'https://api.example.com',
      client: {
        requestDeviceCode: async () => deviceCode,
        requestDeviceToken: async () => {
          tokenRequests += 1

          if (tokenRequests === 1) {
            throw new AuthError('pending', { code: 'authorization_pending' })
          }

          return deviceToken
        },
      },
      noOpen: true,
      sleep: async (milliseconds) => {
        sleeps.push(milliseconds)
      },
      writeLine: () => {},
    })

    expect(token).toBe(deviceToken)
    expect(sleeps).toEqual([1000, 1000])
    expect(tokenRequests).toBe(2)
  })

  test('backs off when Better Auth returns slow_down', async () => {
    const sleeps: number[] = []
    let tokenRequests = 0

    await runDeviceAuthorizationFlow({
      apiUrl: 'https://api.example.com',
      client: {
        requestDeviceCode: async () => ({
          ...deviceCode,
          interval: 2,
        }),
        requestDeviceToken: async () => {
          tokenRequests += 1

          if (tokenRequests === 1) {
            throw new AuthError('slow down', { code: 'slow_down' })
          }

          return deviceToken
        },
      },
      noOpen: true,
      sleep: async (milliseconds) => {
        sleeps.push(milliseconds)
      },
      writeLine: () => {},
    })

    expect(sleeps).toEqual([2000, 7000])
  })

  test('stops when access is denied', async () => {
    await expect(
      runDeviceAuthorizationFlow({
        apiUrl: 'https://api.example.com',
        client: {
          requestDeviceCode: async () => deviceCode,
          requestDeviceToken: async () => {
            throw new AuthError('denied', { code: 'access_denied' })
          },
        },
        noOpen: true,
        sleep: async () => {},
        writeLine: () => {},
      }),
    ).rejects.toThrow('CLI access was denied')
  })

  test('stops when the device code expires', async () => {
    await expect(
      runDeviceAuthorizationFlow({
        apiUrl: 'https://api.example.com',
        client: {
          requestDeviceCode: async () => deviceCode,
          requestDeviceToken: async () => {
            throw new AuthError('expired', { code: 'expired_token' })
          },
        },
        noOpen: true,
        sleep: async () => {},
        writeLine: () => {},
      }),
    ).rejects.toThrow('authorization code expired')
  })

  test('stops when the client-side device code deadline passes', async () => {
    let now = 0
    let tokenRequests = 0

    await expect(
      runDeviceAuthorizationFlow({
        apiUrl: 'https://api.example.com',
        client: {
          requestDeviceCode: async () => ({
            ...deviceCode,
            expires_in: 1,
            interval: 1,
          }),
          requestDeviceToken: async () => {
            tokenRequests += 1
            throw new AuthError('pending', { code: 'authorization_pending' })
          },
        },
        noOpen: true,
        now: () => now,
        sleep: async (milliseconds) => {
          now += milliseconds
        },
        writeLine: () => {},
      }),
    ).rejects.toThrow('authorization code expired')
    expect(tokenRequests).toBe(0)
  })
})

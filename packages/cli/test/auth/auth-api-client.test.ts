import { describe, expect, test } from 'bun:test'

import {
  AuthError,
  createApiKey,
  deleteApiKey,
  getSession,
  requestDeviceCode,
  requestDeviceToken,
  type AuthApiFetch,
} from '../../src/auth/data-access/auth-api-client'

function createJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: {
      'content-type': 'application/json',
    },
    status,
  })
}

function createFetch(
  response: Response,
  requests: Array<{ body: unknown; headers: Headers; method?: string; url: string }>,
) {
  return (async (input, init) => {
    requests.push({
      body: init?.body ? JSON.parse(String(init.body)) : null,
      headers: new Headers(init?.headers),
      method: init?.method,
      url: String(input),
    })

    return response
  }) satisfies AuthApiFetch
}

describe('auth api client', () => {
  test('requests a Better Auth device code with the CLI client and scope', async () => {
    const requests: Array<{ body: unknown; headers: Headers; method?: string; url: string }> = []
    const fetch = createFetch(
      createJsonResponse({
        device_code: 'device-code',
        expires_in: 900,
        interval: 5,
        user_code: 'ABCD1234',
        verification_uri: 'https://app.example.com/cli/authorize',
        verification_uri_complete: 'https://app.example.com/cli/authorize?user_code=ABCD1234',
      }),
      requests,
    )

    const result = await requestDeviceCode({
      apiUrl: 'https://api.example.com',
      clientId: 'tokengator-cli',
      fetch,
      scope: 'cli',
    })

    expect(result.user_code).toBe('ABCD1234')
    expect(requests).toHaveLength(1)
    expect(requests[0]).toMatchObject({
      body: {
        client_id: 'tokengator-cli',
        scope: 'cli',
      },
      method: 'POST',
      url: 'https://api.example.com/api/auth/device/code',
    })
  })

  test('creates API keys with bearer auth and parses wrapped Better Auth responses', async () => {
    const requests: Array<{ body: unknown; headers: Headers; method?: string; url: string }> = []
    const fetch = createFetch(
      createJsonResponse({
        data: {
          id: 'key-id',
          key: 'tg_cli_secret',
          name: 'Tokengator CLI on host',
        },
      }),
      requests,
    )

    const result = await createApiKey({
      accessToken: 'device-access-token',
      apiUrl: 'https://api.example.com',
      expiresIn: 7776000,
      fetch,
      metadata: {
        clientId: 'tokengator-cli',
        hostname: 'host',
      },
      name: 'Tokengator CLI on host',
    })

    expect(result).toEqual({
      id: 'key-id',
      key: 'tg_cli_secret',
      name: 'Tokengator CLI on host',
    })
    expect(requests[0]?.headers.get('Authorization')).toBe('Bearer device-access-token')
    expect(requests[0]?.body).toEqual({
      configId: 'cli',
      expiresIn: 7776000,
      metadata: {
        clientId: 'tokengator-cli',
        hostname: 'host',
      },
      name: 'Tokengator CLI on host',
    })
  })

  test('deletes API keys with x-api-key auth', async () => {
    const requests: Array<{ body: unknown; headers: Headers; method?: string; url: string }> = []
    const fetch = createFetch(createJsonResponse({ success: true }), requests)

    await deleteApiKey({
      apiKey: 'tg_cli_secret',
      apiUrl: 'https://api.example.com',
      fetch,
      keyId: 'key-id',
    })

    expect(requests[0]?.headers.get('x-api-key')).toBe('tg_cli_secret')
    expect(requests[0]?.body).toEqual({
      configId: 'cli',
      keyId: 'key-id',
    })
  })

  test('looks up sessions with x-api-key auth', async () => {
    const requests: Array<{ body: unknown; headers: Headers; method?: string; url: string }> = []
    const fetch = createFetch(
      createJsonResponse({
        session: {
          id: 'key-id',
          userId: 'user-id',
        },
        user: {
          id: 'user-id',
        },
      }),
      requests,
    )

    const result = await getSession({
      apiKey: 'tg_cli_secret',
      apiUrl: 'https://api.example.com',
      fetch,
    })

    expect(result?.session.id).toBe('key-id')
    expect(requests[0]).toMatchObject({
      body: null,
      method: 'GET',
      url: 'https://api.example.com/api/auth/get-session',
    })
    expect(requests[0]?.headers.get('x-api-key')).toBe('tg_cli_secret')
  })

  test('preserves Better Auth polling error codes', async () => {
    const requests: Array<{ body: unknown; headers: Headers; method?: string; url: string }> = []
    const fetch = createFetch(
      createJsonResponse(
        {
          error: 'authorization_pending',
          error_description: 'Authorization is still pending.',
        },
        400,
      ),
      requests,
    )

    await expect(
      requestDeviceToken({
        apiUrl: 'https://api.example.com',
        clientId: 'tokengator-cli',
        deviceCode: 'device-code',
        fetch,
      }),
    ).rejects.toMatchObject({
      code: 'authorization_pending',
    } satisfies Partial<AuthError>)
  })
})

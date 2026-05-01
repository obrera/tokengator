import { afterEach, describe, expect, test } from 'bun:test'
import { writeFileSync } from 'node:fs'

import {
  AdminApiError,
  createAdminApiClient,
  createPublicApiClient,
  type AdminApiFetch,
} from '../../src/api/data-access/admin-api-client'
import { cleanupTempConfigHomes, createTempConfigHome, getTempConfigPath } from '../config/config-test-utils'

type CapturedRequest = {
  body: unknown
  headers: Headers
  method: string
  url: string
}

type Deferred<T> = {
  promise: Promise<T>
  resolve(value: T): void
}

function createJsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: {
      'content-type': 'application/json',
    },
    status,
  })
}

function createConfig(configPath: string) {
  writeFileSync(
    configPath,
    JSON.stringify(
      {
        activeProfile: 'default',
        profiles: {
          default: {
            apiKey: 'default-key',
            apiUrl: 'https://api.example.com/base',
          },
          dev: {
            apiKey: 'dev-key',
            apiUrl: 'http://localhost:3000',
          },
        },
      },
      null,
      2,
    ),
  )
}

function createDeferred<T = void>(): Deferred<T> {
  let resolve!: (value: T) => void
  const promise = new Promise<T>((resolver) => {
    resolve = resolver
  })

  return { promise, resolve }
}

function createFetch(response: Response, requests: CapturedRequest[]) {
  return (async (input, init) => {
    const request = input instanceof Request ? input : new Request(input.toString(), init)
    let body: unknown = null

    if (request.body) {
      body = await request.clone().json()
    }

    requests.push({
      body,
      headers: new Headers(request.headers),
      method: request.method,
      url: request.url,
    })

    return response
  }) satisfies AdminApiFetch
}

function createVerboseFailureResponse(input: {
  body: string
  onText?: () => void
  releaseText?: Promise<void>
  status: number
  statusText: string
  url: string
}): Response {
  return {
    clone: () => ({
      text: async () => input.body,
    }),
    headers: new Headers({
      'content-type': 'application/json',
    }),
    ok: false,
    status: input.status,
    statusText: input.statusText,
    text: async () => {
      input.onText?.()
      await input.releaseText

      return input.body
    },
    url: input.url,
  } as unknown as Response
}

afterEach(() => {
  cleanupTempConfigHomes()
})

describe('admin api client', () => {
  test('normalizes the API reference URL and sends JSON bodies with x-api-key auth', async () => {
    const configPath = getTempConfigPath(createTempConfigHome())
    const requests: CapturedRequest[] = []

    createConfig(configPath)

    const apiClient = createAdminApiClient({
      configPath,
      fetch: createFetch(
        createJsonResponse({
          address: 'asset-address',
          decimals: 0,
          enabled: true,
          id: 'asset-group-id',
          label: 'Asset Group',
          resolverKind: 'helius-collection-assets',
          type: 'collection',
        }),
        requests,
      ),
    })

    await apiClient.assetGroupCreate({
      address: 'asset-address',
      label: 'Asset Group',
      type: 'collection',
    })

    expect(requests).toHaveLength(1)
    expect(requests[0]?.body).toEqual({
      address: 'asset-address',
      label: 'Asset Group',
      type: 'collection',
    })
    expect(requests[0]?.headers.get('content-type')).toBe('application/json')
    expect(requests[0]?.headers.get('x-api-key')).toBe('default-key')
    expect(requests[0]?.method).toBe('POST')
    expect(requests[0]?.url).toBe('https://api.example.com/base/api-reference/adminAssetGroup/create')
  })

  test('uses an explicitly selected profile', async () => {
    const configPath = getTempConfigPath(createTempConfigHome())
    const requests: CapturedRequest[] = []

    createConfig(configPath)

    const apiClient = createAdminApiClient({
      configPath,
      fetch: createFetch(createJsonResponse({ limit: 25, offset: 0, organizations: [], total: 0 }), requests),
      profile: 'dev',
    })

    await apiClient.organizationList()

    expect(requests[0]?.headers.get('x-api-key')).toBe('dev-key')
    expect(requests[0]?.url).toBe('http://localhost:3000/api-reference/adminOrganization/list')
  })

  test('uses explicit credentials without reading a stored profile', async () => {
    const requests: CapturedRequest[] = []
    const apiClient = createAdminApiClient({
      credentials: {
        apiKey: 'seed-key',
        apiUrl: 'http://127.0.0.1:3000',
      },
      fetch: createFetch(createJsonResponse({ total: 0, users: [] }), requests),
    })

    await apiClient.userList({})

    expect(requests[0]?.headers.get('x-api-key')).toBe('seed-key')
    expect(requests[0]?.url).toBe('http://127.0.0.1:3000/api-reference/adminUser/list')
  })

  test('creates a public client for unauthenticated core status checks', async () => {
    const requests: CapturedRequest[] = []
    const apiClient = createPublicApiClient({
      apiUrl: 'http://127.0.0.1:3000',
      fetch: createFetch(createJsonResponse({ configured: false }), requests),
    })

    await expect(apiClient.coreStatus()).resolves.toEqual({
      configured: false,
    })
    expect(requests[0]?.headers.get('x-api-key')).toBeNull()
    expect(requests[0]?.url).toBe('http://127.0.0.1:3000/api-reference/core/status')
  })

  test('adds verbose API failure details', async () => {
    const configPath = getTempConfigPath(createTempConfigHome())

    createConfig(configPath)

    const apiClient = createAdminApiClient({
      configPath,
      fetch: createFetch(
        createJsonResponse(
          {
            code: 'FORBIDDEN',
            message: 'Admin access required.',
            status: 403,
          },
          403,
        ),
        [],
      ),
      verbose: true,
    })

    try {
      await apiClient.organizationList()
      throw new Error('Expected organizationList to fail.')
    } catch (error) {
      expect(error).toBeInstanceOf(AdminApiError)
      const apiError = error as AdminApiError
      expect(apiError.code).toBe('FORBIDDEN')
      expect(apiError.details).toEqual([
        'HTTP status: 403',
        'Error code: FORBIDDEN',
        'Request: POST https://api.example.com/base/api-reference/adminOrganization/list',
        'Response content-type: application/json',
        'Response body: {"code":"FORBIDDEN","message":"Admin access required.","status":403}',
      ])
      expect(apiError.message).toBe('Admin access required.')
      expect(apiError.status).toBe(403)
    }
  })

  test('keeps verbose failure details isolated across concurrent requests', async () => {
    const configPath = getTempConfigPath(createTempConfigHome())
    const firstTextStarted = createDeferred()
    const releaseFirstText = createDeferred()

    createConfig(configPath)

    const apiClient = createAdminApiClient({
      configPath,
      fetch: (async (input, init) => {
        const request = input instanceof Request ? input : new Request(input.toString(), init)

        if (request.url.endsWith('/adminOrganization/list')) {
          return createVerboseFailureResponse({
            body: JSON.stringify({
              code: 'LIST_FAILED',
              message: 'List failed.',
              status: 500,
            }),
            onText: () => firstTextStarted.resolve(),
            releaseText: releaseFirstText.promise,
            status: 500,
            statusText: 'Internal Server Error',
            url: request.url,
          })
        }

        return createVerboseFailureResponse({
          body: JSON.stringify({
            code: 'OWNER_CANDIDATES_FAILED',
            message: 'Owner candidates failed.',
            status: 409,
          }),
          status: 409,
          statusText: 'Conflict',
          url: request.url,
        })
      }) satisfies AdminApiFetch,
      verbose: true,
    })

    const listErrorPromise = apiClient.organizationList().catch((error) => error)

    await firstTextStarted.promise
    const ownerCandidatesError = await apiClient.organizationListOwnerCandidates().catch((error) => error)

    releaseFirstText.resolve()
    const listError = await listErrorPromise

    expect(listError).toBeInstanceOf(AdminApiError)
    expect(ownerCandidatesError).toBeInstanceOf(AdminApiError)
    expect((listError as AdminApiError).details).toContain(
      'Request: POST https://api.example.com/base/api-reference/adminOrganization/list',
    )
    expect((ownerCandidatesError as AdminApiError).details).toContain(
      'Request: POST https://api.example.com/base/api-reference/adminOrganization/listOwnerCandidates',
    )
  })
})

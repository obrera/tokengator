import { describe, expect, test } from 'bun:test'

import { createRealmsApiAdapter } from '../src/adapters/realms-api'
import { ProviderError } from '../src/errors'
import { createRealmsResolvers } from '../src/resolvers/realms'

const REALM = {
  authority: 'authority-a',
  council: 'council-a',
  id: 1,
  mint: 'mint-a',
  name: 'Realm Alpha',
  plugin: 'plugin-a',
  program: 'program-a',
  publicKey: 'realm-a',
} as const

const REALM_WITH_OPTIONAL_FIELDS = {
  authority: null,
  council: null,
  id: 2,
  mint: 'mint-b',
  name: 'Realm Beta',
  plugin: null,
  program: 'program-b',
  publicKey: 'realm-b',
} as const

const VOTER = {
  deposit: '10',
  publicKey: 'record-a',
  realm: 'realm-a',
  registrar: 'registrar-a',
  voter: 'wallet-a',
  weight: '10',
} as const

describe('createRealmsApiAdapter', () => {
  test('clears the cached realms request after failures', async () => {
    let callCount = 0
    const adapter = createRealmsApiAdapter({
      attempts: 1,
      fetch: async () => {
        callCount += 1

        return callCount === 1 ? new Response('unavailable', { status: 503 }) : Response.json([REALM])
      },
    })

    await expect(adapter.getRealm({ realm: REALM.publicKey })).rejects.toMatchObject({
      code: 'http_5xx',
      provider: 'realms',
    })

    expect(await adapter.getRealm({ realm: REALM.publicKey })).toEqual(REALM)
    expect(callCount).toBe(2)
  })

  test('allows realms without authority, council, or plugin metadata', async () => {
    const adapter = createRealmsApiAdapter({
      attempts: 1,
      fetch: async () =>
        Response.json([
          {
            ...REALM_WITH_OPTIONAL_FIELDS,
            plugin: '',
          },
        ]),
    })

    expect(await adapter.getRealm({ realm: REALM_WITH_OPTIONAL_FIELDS.publicKey })).toEqual(REALM_WITH_OPTIONAL_FIELDS)
  })

  test('reports the actual retry attempt in HTTP error metadata', async () => {
    let callCount = 0
    const adapter = createRealmsApiAdapter({
      attempts: 2,
      fetch: async () => {
        callCount += 1

        return new Response('unavailable', { status: 503 })
      },
    })

    await expect(adapter.getRealm({ realm: REALM.publicKey })).rejects.toMatchObject({
      code: 'http_5xx',
      metadata: {
        attempts: 2,
        status: 503,
      },
      provider: 'realms',
    })

    expect(callCount).toBe(2)
  })

  test('ignores malformed realm directory entries', async () => {
    const adapter = createRealmsApiAdapter({
      attempts: 1,
      fetch: async () =>
        Response.json([
          REALM,
          {
            publicKey: 'realm-b',
          },
        ]),
    })

    expect(await adapter.getRealm({ realm: REALM.publicKey })).toEqual(REALM)
    expect(await adapter.getRealm({ realm: 'realm-b' })).toBeNull()
  })

  test('fails when voters payload contains malformed entries', async () => {
    const adapter = createRealmsApiAdapter({
      attempts: 1,
      fetch: async () =>
        Response.json([
          VOTER,
          {
            publicKey: 'record-b',
          },
        ]),
    })

    await expect(adapter.getRealmVoters({ realm: REALM.publicKey })).rejects.toMatchObject({
      code: 'invalid_response',
      message: 'Invalid Realms API response: malformed voter entry at index 1.',
      provider: 'realms',
    })
  })

  test('passes the signal through to voter requests', async () => {
    const controller = new AbortController()
    let receivedSignal: AbortSignal | null = null
    const adapter = createRealmsApiAdapter({
      fetch: async (_url, init) => {
        receivedSignal = (init?.signal as AbortSignal | undefined) ?? null

        return Response.json([VOTER])
      },
    })

    expect(await adapter.getRealmVoters({ realm: REALM.publicKey, signal: controller.signal })).toEqual([VOTER])
    expect(receivedSignal!).toBe(controller.signal)
  })
})

describe('createRealmsResolvers', () => {
  test('aborts before fetching when the signal is already cancelled', async () => {
    const controller = new AbortController()
    controller.abort()
    let called = false
    const resolver = createRealmsResolvers({
      async getRealm() {
        return REALM
      },
      async getRealmVoters() {
        called = true

        return [VOTER]
      },
    })[0]!

    await expect(
      resolver.resolve({
        context: {
          signal: controller.signal,
        },
        onPage: () => true,
        resolver: {
          config: {
            realm: REALM.publicKey,
          },
          id: 'resolver-a',
          kind: 'realms-voters',
        },
      }),
    ).rejects.toBeInstanceOf(ProviderError)

    expect(called).toBe(false)
  })
})

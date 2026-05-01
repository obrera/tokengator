import { apiKeyClient } from '@better-auth/api-key/client'
import { createKeyPairSignerFromBytes, getBase58Decoder, signBytes } from '@solana/kit'
import { createSIWSMessage, siwsClient } from 'better-auth-solana/client'
import { createAuthClient } from 'better-auth/client'

import { AuthError, getSession, type AuthApiFetch, type AuthApiKey, type AuthSession } from './auth-api-client'

export type SiwsFixture = {
  publicKey: string
  secret: readonly number[]
}

type SiwsLoginOptions = {
  apiKeyName: string
  apiUrl: string
  expiresIn: number
  fetch?: AuthApiFetch
  fixture: SiwsFixture
  metadata: Record<string, string>
  signal?: AbortSignal
  statement: string
  verbose?: boolean
}

const CLI_API_KEY_CONFIG_ID = 'cli'

function buildCookieHeader(cookieJar: Map<string, string>) {
  return [...cookieJar.values()].sort((left, right) => left.localeCompare(right)).join('; ')
}

function createCookieFetch(input: { apiUrl: string; fetch?: AuthApiFetch }): AuthApiFetch {
  const cookieJar = new Map<string, string>()
  const origin = new URL(input.apiUrl).origin
  const requestFetch = input.fetch ?? ((...args) => globalThis.fetch(...args))

  return async (requestInput, init) => {
    const existingCookieHeader = new Headers(init?.headers).get('cookie')
    const nextHeaders = new Headers(init?.headers)
    const storedCookieHeader = buildCookieHeader(cookieJar)
    const cookieHeader = [existingCookieHeader, storedCookieHeader].filter(Boolean).join('; ')

    if (!nextHeaders.has('origin')) {
      nextHeaders.set('origin', origin)
    }

    if (cookieHeader) {
      nextHeaders.set('cookie', cookieHeader)
    }

    const response = await requestFetch(requestInput, {
      ...init,
      headers: nextHeaders,
    })
    const setCookies = 'getSetCookie' in response.headers ? response.headers.getSetCookie() : []

    for (const setCookie of setCookies) {
      const firstSegment = setCookie.split(';', 1)[0] ?? ''
      const separatorIndex = firstSegment.indexOf('=')

      if (separatorIndex === -1) {
        continue
      }

      const name = firstSegment.slice(0, separatorIndex).trim()
      const value = firstSegment.slice(separatorIndex + 1).trim()

      if (name) {
        cookieJar.set(name, `${name}=${value}`)
      }
    }

    return response
  }
}

function createSiwsAuthClient(input: { apiUrl: string; fetch?: AuthApiFetch; signal?: AbortSignal }) {
  return createAuthClient({
    baseURL: input.apiUrl,
    fetchOptions: {
      credentials: 'include',
      customFetchImpl: createCookieFetch({
        apiUrl: input.apiUrl,
        fetch: input.fetch,
      }),
      signal: input.signal,
    },
    plugins: [apiKeyClient(), siwsClient()],
  })
}

function getAuthClientError(error: unknown, fallback: string) {
  if (error && typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return error.message
  }

  return fallback
}

export async function createSiwsApiKey(options: SiwsLoginOptions): Promise<{
  apiKey: AuthApiKey
  session: AuthSession
}> {
  const authClient = createSiwsAuthClient({
    apiUrl: options.apiUrl,
    fetch: options.fetch,
    signal: options.signal,
  })
  const { data: challenge, error: challengeError } = await authClient.siws.nonce({
    walletAddress: options.fixture.publicKey,
  })

  if (!challenge) {
    throw new AuthError(getAuthClientError(challengeError, 'Failed to request SIWS challenge.'))
  }

  const message = createSIWSMessage({
    address: options.fixture.publicKey,
    challenge,
    statement: options.statement,
  })
  const signer = await createKeyPairSignerFromBytes(new Uint8Array(options.fixture.secret))

  if (signer.address !== options.fixture.publicKey) {
    throw new AuthError(`Fixture public key mismatch for ${options.fixture.publicKey}.`)
  }

  const signatureBytes = await signBytes(signer.keyPair.privateKey, new TextEncoder().encode(message))
  const { data: verification, error: verificationError } = await authClient.siws.verify({
    message,
    signature: getBase58Decoder().decode(signatureBytes),
    walletAddress: options.fixture.publicKey,
  })

  if (!verification) {
    throw new AuthError(getAuthClientError(verificationError, 'Failed to verify SIWS login.'))
  }

  const { data: apiKey, error: apiKeyError } = await authClient.apiKey.create({
    configId: CLI_API_KEY_CONFIG_ID,
    expiresIn: options.expiresIn,
    metadata: options.metadata,
    name: options.apiKeyName,
  })

  if (!apiKey?.id || !apiKey.key) {
    throw new AuthError(getAuthClientError(apiKeyError, 'API key creation did not return a usable key.'))
  }

  await authClient.signOut().catch(() => {})

  const session = await getSession({
    apiKey: apiKey.key,
    apiUrl: options.apiUrl,
    fetch: options.fetch,
    signal: options.signal,
    verbose: options.verbose,
  })

  if (!session) {
    throw new AuthError('API key verification failed.')
  }

  return {
    apiKey,
    session,
  }
}

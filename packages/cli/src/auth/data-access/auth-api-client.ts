import { apiKeyClient } from '@better-auth/api-key/client'
import { createAuthClient } from 'better-auth/client'
import { deviceAuthorizationClient } from 'better-auth/client/plugins'

export class AuthError extends Error {
  code?: string
  status?: number

  constructor(message: string, options: { code?: string; status?: number } = {}) {
    super(message)
    this.name = 'AuthError'
    this.code = options.code
    this.status = options.status
  }
}

export type AuthApiFetch = (...args: Parameters<typeof fetch>) => ReturnType<typeof fetch>

export type AuthApiKey = {
  id: string
  key: string
  name?: string | null
}

export type AuthDeviceCode = {
  device_code: string
  expires_in: number
  interval: number
  user_code: string
  verification_uri: string
  verification_uri_complete: string
}

export type AuthDeviceToken = {
  access_token: string
  expires_in: number
  scope: string
  token_type: string
}

export type AuthSession = {
  session: {
    id: string
    userId: string
  }
  user: {
    email?: string | null
    id: string
    name?: string | null
    username?: string | null
  }
}

type JsonRecord = Record<string, unknown>
type AuthRequestArgs = {
  apiUrl: string
  fetch?: AuthApiFetch
  signal?: AbortSignal
}

const CLI_API_KEY_CONFIG_ID = 'cli'
const DEVICE_CODE_GRANT_TYPE = 'urn:ietf:params:oauth:grant-type:device_code'

function getErrorString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function getRecord(value: unknown): JsonRecord | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonRecord) : undefined
}

function getAuthClient(apiUrl: string) {
  return createAuthClient({
    baseURL: apiUrl,
    plugins: [apiKeyClient(), deviceAuthorizationClient()],
  })
}

function getFetchOptions(args: AuthRequestArgs, headers?: Record<string, string>) {
  return {
    customFetchImpl: args.fetch,
    headers,
    signal: args.signal,
    throw: true,
  } as const
}

function getResponseError(payload: unknown, fallback: string) {
  const record = getRecord(payload)
  const error = record?.error
  const errorRecord = getRecord(error)
  const code =
    getErrorString(error) ??
    getErrorString(errorRecord?.code) ??
    getErrorString(record?.code) ??
    getErrorString(record?.statusText)
  const message =
    getErrorString(record?.error_description) ??
    getErrorString(errorRecord?.message) ??
    getErrorString(record?.message) ??
    getErrorString(error) ??
    fallback

  return { code, message }
}

function getStatus(value: unknown): number | undefined {
  const status = getRecord(value)?.status

  return typeof status === 'number' ? status : undefined
}

function getAuthErrorPayload(error: unknown) {
  const record = getRecord(error)

  return record?.error ?? record?.cause ?? error
}

function toAuthError(error: unknown, fallback: string) {
  const payload = getAuthErrorPayload(error)
  const { code, message } = getResponseError(payload, fallback)

  return new AuthError(message, { code, status: getStatus(error) ?? getStatus(payload) })
}

function unwrapAuthData<T>(payload: unknown): T {
  const record = getRecord(payload)

  return (record && 'data' in record ? record.data : payload) as T
}

async function authRequest<T>(
  apiUrl: string,
  request: (authClient: ReturnType<typeof getAuthClient>) => Promise<unknown>,
  fallback: string,
): Promise<T> {
  try {
    return unwrapAuthData<T>(await request(getAuthClient(apiUrl)))
  } catch (error) {
    throw toAuthError(error, fallback)
  }
}

export async function createApiKey(
  args: AuthRequestArgs & {
    accessToken: string
    expiresIn: number
    metadata: Record<string, string>
    name: string
  },
): Promise<AuthApiKey> {
  return await authRequest<AuthApiKey>(
    args.apiUrl,
    (authClient) =>
      authClient.apiKey.create(
        {
          configId: CLI_API_KEY_CONFIG_ID,
          expiresIn: args.expiresIn,
          metadata: args.metadata,
          name: args.name,
        },
        getFetchOptions(args, {
          Authorization: `Bearer ${args.accessToken}`,
        }),
      ),
    'Unable to create CLI API key.',
  )
}

export async function deleteApiKey(
  args: AuthRequestArgs & {
    apiKey: string
    keyId: string
  },
): Promise<{ success: boolean }> {
  return await authRequest<{ success: boolean }>(
    args.apiUrl,
    (authClient) =>
      authClient.apiKey.delete(
        {
          configId: CLI_API_KEY_CONFIG_ID,
          keyId: args.keyId,
        },
        getFetchOptions(args, {
          'x-api-key': args.apiKey,
        }),
      ),
    'Unable to delete CLI API key.',
  )
}

export async function getSession(
  args: AuthRequestArgs & {
    apiKey: string
  },
): Promise<AuthSession | null> {
  return await authRequest<AuthSession | null>(
    args.apiUrl,
    (authClient) =>
      authClient.getSession(
        {},
        getFetchOptions(args, {
          'x-api-key': args.apiKey,
        }),
      ),
    'Unable to look up CLI session.',
  )
}

export async function requestDeviceCode(
  args: AuthRequestArgs & {
    clientId: string
    scope: string
  },
): Promise<AuthDeviceCode> {
  return await authRequest<AuthDeviceCode>(
    args.apiUrl,
    (authClient) =>
      authClient.device.code(
        {
          client_id: args.clientId,
          scope: args.scope,
        },
        getFetchOptions(args),
      ),
    'Unable to request CLI device code.',
  )
}

export async function requestDeviceToken(
  args: AuthRequestArgs & {
    clientId: string
    deviceCode: string
  },
): Promise<AuthDeviceToken> {
  return await authRequest<AuthDeviceToken>(
    args.apiUrl,
    (authClient) =>
      authClient.device.token(
        {
          client_id: args.clientId,
          device_code: args.deviceCode,
          grant_type: DEVICE_CODE_GRANT_TYPE,
        },
        getFetchOptions(args),
      ),
    'Unable to finish CLI device authorization.',
  )
}

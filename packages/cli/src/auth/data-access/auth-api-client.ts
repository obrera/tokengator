import { apiKeyClient } from '@better-auth/api-key/client'
import { createAuthClient } from 'better-auth/client'
import { deviceAuthorizationClient } from 'better-auth/client/plugins'

export class AuthError extends Error {
  code?: string
  details?: string[]
  status?: number

  constructor(message: string, options: { code?: string; details?: string[]; status?: number } = {}) {
    super(message)
    this.name = 'AuthError'
    this.code = options.code
    this.details = options.details?.length ? options.details : undefined
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
  verbose?: boolean
}
type AuthResponseDetails = {
  body?: string
  contentType?: string | null
  method: string
  status?: number
  statusText?: string
  transportError?: string
  url: string
}

const CLI_API_KEY_CONFIG_ID = 'cli'
const DEVICE_CODE_GRANT_TYPE = 'urn:ietf:params:oauth:grant-type:device_code'
const MAX_VERBOSE_RESPONSE_BODY_LENGTH = 2000

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

function getFetchImplementation(fetchImpl?: AuthApiFetch): AuthApiFetch {
  return fetchImpl ?? ((...args) => globalThis.fetch(...args))
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

function getRequestMethod(input: Parameters<AuthApiFetch>[0], init: Parameters<AuthApiFetch>[1]): string {
  if (init?.method) {
    return init.method
  }

  if (typeof Request !== 'undefined' && input instanceof Request) {
    return input.method
  }

  return 'GET'
}

function getRequestUrl(input: Parameters<AuthApiFetch>[0]): string {
  if (typeof input === 'string') {
    return input
  }

  if (input instanceof URL) {
    return input.toString()
  }

  return input.url
}

async function getResponseBody(response: Response): Promise<string | undefined> {
  try {
    const body = (await response.clone().text()).trim()

    return body ? body : undefined
  } catch {
    return undefined
  }
}

function getTruncatedResponseBody(body: string): string {
  if (body.length <= MAX_VERBOSE_RESPONSE_BODY_LENGTH) {
    return body
  }

  return `${body.slice(0, MAX_VERBOSE_RESPONSE_BODY_LENGTH)}\n... truncated`
}

function getTransportErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (typeof error === 'string' && error.trim()) {
    return error.trim()
  }

  return 'Request failed before receiving an HTTP response.'
}

function getAuthErrorDetails(input: { code?: string; response?: AuthResponseDetails; status?: number }): string[] {
  const details: string[] = []
  const responseStatus =
    typeof input.response?.status === 'number'
      ? `${input.response.status}${input.response.statusText ? ` ${input.response.statusText}` : ''}`
      : input.status !== undefined
        ? String(input.status)
        : undefined

  if (responseStatus) {
    details.push(`HTTP status: ${responseStatus}`)
  }

  if (input.code) {
    details.push(`Error code: ${input.code}`)
  }

  if (input.response) {
    details.push(`Request: ${input.response.method} ${input.response.url}`)

    if (input.response.contentType) {
      details.push(`Response content-type: ${input.response.contentType}`)
    }

    if (input.response.body) {
      details.push(`Response body: ${getTruncatedResponseBody(input.response.body)}`)
    }

    if (input.response.transportError) {
      details.push(`Transport error: ${input.response.transportError}`)
    }
  }

  return details
}

function createVerboseFetch(
  fetchImpl: AuthApiFetch | undefined,
  onFailure: (details: AuthResponseDetails) => void,
): AuthApiFetch {
  const requestFetch = getFetchImplementation(fetchImpl)

  return async (input, init) => {
    let response: Response

    try {
      response = await requestFetch(input, init)
    } catch (error) {
      onFailure({
        method: getRequestMethod(input, init),
        transportError: getTransportErrorMessage(error),
        url: getRequestUrl(input),
      })

      throw error
    }

    if (!response.ok) {
      onFailure({
        body: await getResponseBody(response),
        contentType: response.headers.get('content-type'),
        method: getRequestMethod(input, init),
        status: response.status,
        statusText: response.statusText,
        url: response.url || getRequestUrl(input),
      })
    }

    return response
  }
}

function toAuthError(error: unknown, fallback: string, response?: AuthResponseDetails) {
  const payload = getAuthErrorPayload(error)
  const { code, message } = getResponseError(payload, fallback)
  const status = getStatus(error) ?? getStatus(payload) ?? response?.status

  return new AuthError(message, {
    code,
    details: response ? getAuthErrorDetails({ code, response, status }) : undefined,
    status,
  })
}

function unwrapAuthData<T>(payload: unknown): T {
  const record = getRecord(payload)

  return (record && 'data' in record ? record.data : payload) as T
}

async function authRequest<T>(
  args: AuthRequestArgs,
  request: (authClient: ReturnType<typeof getAuthClient>, requestArgs: AuthRequestArgs) => Promise<unknown>,
  fallback: string,
): Promise<T> {
  let responseDetails: AuthResponseDetails | undefined
  const requestArgs = args.verbose
    ? {
        ...args,
        fetch: createVerboseFetch(args.fetch, (details) => {
          responseDetails = details
        }),
      }
    : args

  try {
    return unwrapAuthData<T>(await request(getAuthClient(args.apiUrl), requestArgs))
  } catch (error) {
    throw toAuthError(error, fallback, responseDetails)
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
    args,
    (authClient, requestArgs) =>
      authClient.apiKey.create(
        {
          configId: CLI_API_KEY_CONFIG_ID,
          expiresIn: args.expiresIn,
          metadata: args.metadata,
          name: args.name,
        },
        getFetchOptions(requestArgs, {
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
    args,
    (authClient, requestArgs) =>
      authClient.apiKey.delete(
        {
          configId: CLI_API_KEY_CONFIG_ID,
          keyId: args.keyId,
        },
        getFetchOptions(requestArgs, {
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
    args,
    (authClient, requestArgs) =>
      authClient.getSession(
        {},
        getFetchOptions(requestArgs, {
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
    args,
    (authClient, requestArgs) =>
      authClient.device.code(
        {
          client_id: args.clientId,
          scope: args.scope,
        },
        getFetchOptions(requestArgs),
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
    args,
    (authClient, requestArgs) =>
      authClient.device.token(
        {
          client_id: args.clientId,
          device_code: args.deviceCode,
          grant_type: DEVICE_CODE_GRANT_TYPE,
        },
        getFetchOptions(requestArgs),
      ),
    'Unable to finish CLI device authorization.',
  )
}

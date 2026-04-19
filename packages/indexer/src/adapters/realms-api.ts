import { ProviderError, type ProviderErrorCode } from '../errors'

export const REALMS_API_BASE_URL = 'https://realms-api.com'

type RealmsApiFetch = (input: string | URL, init?: RequestInit) => Promise<Response>

export interface CreateRealmsApiAdapterOptions extends RealmsApiRetryOptions {
  baseUrl?: string
  fetch?: RealmsApiFetch
}

export interface RealmsApiAdapter {
  getRealm(input: { realm: string }): Promise<RealmsRealm | null>
  getRealmVoters(input: { realm: string; signal?: AbortSignal }): Promise<RealmsVoter[]>
}

export interface RealmsApiRetryOptions {
  attempts?: number
  baseDelayMs?: number
  jitterRatio?: number
  maxDelayMs?: number
}

export interface RealmsRealm {
  authority: string
  council: string | null
  id: number
  mint: string
  name: string
  plugin: string | null
  program: string
  publicKey: string
}

export interface RealmsVoter {
  deposit: string
  publicKey: string
  realm: string
  registrar: string
  voter: string
  weight: string
}

interface RealmsAdapterRuntimeOptions {
  fetch: RealmsApiFetch
  random: () => number
  retry: Required<RealmsApiRetryOptions>
  sleep: (ms: number) => Promise<void>
}

const DEFAULT_RETRY_ATTEMPTS = 3
const DEFAULT_RETRY_BASE_DELAY_MS = 150
const DEFAULT_RETRY_JITTER_RATIO = 0.2
const DEFAULT_RETRY_MAX_DELAY_MS = 1_500

const TRANSIENT_NETWORK_ERROR_CODES = new Set([
  'ECONNABORTED',
  'ECONNREFUSED',
  'ECONNRESET',
  'EAI_AGAIN',
  'ENETDOWN',
  'ENETUNREACH',
  'ENOTFOUND',
  'ETIMEDOUT',
  'UND_ERR_CONNECT_TIMEOUT',
  'UND_ERR_HEADERS_TIMEOUT',
  'UND_ERR_SOCKET',
])

export function createRealmsApiAdapter(options: CreateRealmsApiAdapterOptions = {}): RealmsApiAdapter {
  const runtime = createRuntimeOptions(options)
  const baseUrl = options.baseUrl ?? REALMS_API_BASE_URL
  let realmsCache: Promise<RealmsRealm[]> | null = null

  async function getRealms() {
    realmsCache ??= withRetry(async (attempt) => {
      const url = new URL('/realms', baseUrl)
      const response = await runtime.fetch(url)

      if (!response.ok) {
        throw createHttpProviderError(response.status, undefined, attempt)
      }

      const payload = await response.json().catch((error) => {
        throw createInvalidResponseError('Expected valid JSON response from Realms API.', error)
      })

      return expectRealmsArray(payload)
    }, runtime).catch((error) => {
      realmsCache = null

      throw error
    })

    return await realmsCache
  }

  return {
    async getRealm({ realm }) {
      const realms = await getRealms()

      return realms.find((candidate) => candidate.publicKey === realm) ?? null
    },

    async getRealmVoters({ realm, signal }) {
      const voters = await withRetry(async (attempt) => {
        const url = new URL(`/voters/${realm}`, baseUrl)
        const response = await runtime.fetch(url, {
          signal,
        })

        if (!response.ok) {
          throw createHttpProviderError(response.status, realm, attempt)
        }

        const payload = await response.json().catch((error) => {
          throw createInvalidResponseError('Expected valid JSON response from Realms API.', error)
        })

        return expectVotersArray(payload)
      }, runtime)

      return [...voters].sort(
        (left, right) =>
          left.publicKey.localeCompare(right.publicKey) ||
          left.voter.localeCompare(right.voter) ||
          left.realm.localeCompare(right.realm),
      )
    },
  }
}

function calculateBackoffDelayMs(attempt: number, runtime: RealmsAdapterRuntimeOptions): number {
  const exponential = runtime.retry.baseDelayMs * 2 ** (attempt - 1)
  const boundedDelay = Math.min(exponential, runtime.retry.maxDelayMs)

  if (boundedDelay === 0 || runtime.retry.jitterRatio === 0) {
    return boundedDelay
  }

  const jitterWindow = boundedDelay * runtime.retry.jitterRatio
  const randomOffset = runtime.random() * jitterWindow

  return Math.floor(Math.max(0, boundedDelay - jitterWindow / 2 + randomOffset))
}

function createHttpProviderError(status: number, realm: string | undefined, attempt: number) {
  const code: ProviderErrorCode = status === 429 ? 'http_429' : status >= 500 ? 'http_5xx' : 'provider_error'

  return new ProviderError({
    code,
    message: `Realms API request failed with status ${status}.`,
    metadata: {
      attempts: attempt,
      realm,
      status,
    },
    provider: 'realms',
    retryable: status === 429 || status >= 500,
  })
}

function createInvalidResponseError(message: string, cause?: unknown) {
  return new ProviderError({
    cause,
    code: 'invalid_response',
    message,
    provider: 'realms',
    retryable: false,
  })
}

function createNetworkProviderError(error: unknown, attempt: number) {
  return new ProviderError({
    cause: error,
    code: 'network_error',
    message: error instanceof Error && error.message ? error.message : 'Realms API request failed.',
    metadata: {
      attempts: attempt,
    },
    provider: 'realms',
    retryable: true,
  })
}

function createRuntimeOptions(options: CreateRealmsApiAdapterOptions): RealmsAdapterRuntimeOptions {
  return {
    fetch: options.fetch ?? fetch,
    random: Math.random,
    retry: {
      attempts: Math.max(1, Math.floor(options.attempts ?? DEFAULT_RETRY_ATTEMPTS)),
      baseDelayMs: Math.max(0, options.baseDelayMs ?? DEFAULT_RETRY_BASE_DELAY_MS),
      jitterRatio: Math.max(0, options.jitterRatio ?? DEFAULT_RETRY_JITTER_RATIO),
      maxDelayMs: Math.max(0, options.maxDelayMs ?? DEFAULT_RETRY_MAX_DELAY_MS),
    },
    sleep: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  }
}

function expectRealmsArray(value: unknown): RealmsRealm[] {
  if (!Array.isArray(value)) {
    throw createInvalidResponseError('Invalid Realms API response: expected an array of realms.')
  }

  return value.map((item, index) => {
    const realm = toRealmsRealm(item)

    if (!realm) {
      throw createInvalidResponseError(`Invalid Realms API response: malformed realm entry at index ${index}.`)
    }

    return realm
  })
}

function expectVotersArray(value: unknown): RealmsVoter[] {
  if (!Array.isArray(value)) {
    throw createInvalidResponseError('Invalid Realms API response: expected an array of voters.')
  }

  return value.map((item, index) => {
    const voter = toRealmsVoter(item)

    if (!voter) {
      throw createInvalidResponseError(`Invalid Realms API response: malformed voter entry at index ${index}.`)
    }

    return voter
  })
}

function getErrorCode(error: unknown) {
  return error instanceof Error && 'code' in error ? String(error.code) : null
}

function isRetryableError(error: unknown) {
  if (error instanceof ProviderError) {
    return error.retryable
  }

  return Boolean(getErrorCode(error) && TRANSIENT_NETWORK_ERROR_CODES.has(getErrorCode(error)!))
}

function readNumber(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function readRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null
}

function toRealmsRealm(value: unknown): RealmsRealm | null {
  const record = readRecord(value)

  if (!record) {
    return null
  }

  const authority = readString(record.authority)
  const council = readString(record.council)
  const id = readNumber(record.id)
  const mint = readString(record.mint)
  const name = readString(record.name)
  const plugin = readString(record.plugin)
  const program = readString(record.program)
  const publicKey = readString(record.publicKey)

  if (!authority || id === null || !mint || !name || !program || !publicKey) {
    return null
  }

  return {
    authority,
    council,
    id,
    mint,
    name,
    plugin,
    program,
    publicKey,
  }
}

function toRealmsVoter(value: unknown): RealmsVoter | null {
  const record = readRecord(value)

  if (!record) {
    return null
  }

  const deposit = readString(record.deposit)
  const publicKey = readString(record.publicKey)
  const realm = readString(record.realm)
  const registrar = readString(record.registrar)
  const voter = readString(record.voter)
  const weight = readString(record.weight)

  if (!deposit || !publicKey || !realm || !registrar || !voter || !weight) {
    return null
  }

  return {
    deposit,
    publicKey,
    realm,
    registrar,
    voter,
    weight,
  }
}

async function withRetry<T>(
  callback: (attempt: number) => Promise<T>,
  runtime: RealmsAdapterRuntimeOptions,
): Promise<T> {
  let attempt = 1

  while (true) {
    try {
      return await callback(attempt)
    } catch (error) {
      const providerError =
        error instanceof ProviderError
          ? error
          : isRetryableError(error)
            ? createNetworkProviderError(error, attempt)
            : null

      if (!providerError?.retryable || attempt >= runtime.retry.attempts) {
        throw providerError ?? error
      }

      await runtime.sleep(calculateBackoffDelayMs(attempt, runtime))
      attempt += 1
    }
  }
}

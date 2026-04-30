import type { ProfileOptions } from '../../config/data-access/config-store'
import type {
  AdminAssetGroupCreateData,
  AdminAssetGroupListData,
  AdminAssetGroupListIndexRunsData,
  AdminAssetGroupLookupData,
  AdminAssetGroupUpdateData,
  AdminOrganizationCreateData,
  AdminOrganizationListData,
  AdminOrganizationListOwnerCandidatesData,
  AdminOrganizationUpdateData,
} from '../generated/types.gen'
import { requireStoredAuthCredentials } from '../../auth/data-access/auth-token-store'
import { createClient, type Client as GeneratedClient, type Config as GeneratedClientConfig } from '../generated/client'
import {
  adminAssetGroupCreate,
  adminAssetGroupDelete,
  adminAssetGroupGet,
  adminAssetGroupIndex,
  adminAssetGroupList,
  adminAssetGroupListIndexRuns,
  adminAssetGroupLookup,
  adminAssetGroupUpdate,
  adminOrganizationCreate,
  adminOrganizationDelete,
  adminOrganizationGet,
  adminOrganizationList,
  adminOrganizationListOwnerCandidates,
  adminOrganizationUpdate,
} from '../generated/sdk.gen'

export class AdminApiError extends Error {
  code?: string
  details?: string[]
  status?: number

  constructor(message: string, options: { code?: string; details?: string[]; status?: number } = {}) {
    super(message)
    this.name = 'AdminApiError'
    this.code = options.code
    this.details = options.details?.length ? options.details : undefined
    this.status = options.status
  }
}

export type AdminApiFetch = (...args: Parameters<typeof fetch>) => ReturnType<typeof fetch>
export type AdminAssetGroupCreateInput = AdminAssetGroupCreateData['body']
export type AdminAssetGroupListInput = NonNullable<AdminAssetGroupListData['body']>
export type AdminAssetGroupListIndexRunsInput = AdminAssetGroupListIndexRunsData['body']
export type AdminAssetGroupLookupInput = AdminAssetGroupLookupData['body']
export type AdminAssetGroupResolverKind = 'helius-collection-assets' | 'helius-token-accounts' | 'realms-voters'
export type AdminAssetGroupType = 'collection' | 'mint'
export type AdminAssetGroupUpdateInput = AdminAssetGroupUpdateData['body']['data']
export type AdminOrganizationCreateInput = AdminOrganizationCreateData['body']
export type AdminOrganizationListInput = NonNullable<AdminOrganizationListData['body']>
export type AdminOrganizationListOwnerCandidatesInput = NonNullable<AdminOrganizationListOwnerCandidatesData['body']>
export type AdminOrganizationUpdateInput = AdminOrganizationUpdateData['body']['data']

export type AdminAssetGroup = {
  address: string
  createdAt?: string
  decimals: number
  enabled: boolean
  id: string
  imageUrl?: string | null
  indexingStatus?: JsonRecord | null
  label: string
  resolverKind: AdminAssetGroupResolverKind
  symbol?: string | null
  type: AdminAssetGroupType
  updatedAt?: string
}

export type AdminAssetGroupListResult = {
  assetGroups: AdminAssetGroup[]
  limit: number
  offset: number
  total: number
}

export type AdminOrganization = {
  createdAt?: string
  description?: string | null
  discordUrl?: string | null
  githubUrl?: string | null
  id: string
  logo?: string | null
  memberCount?: number
  name: string
  owners?: Array<{ name: string; userId: string; username?: string | null }>
  slug: string
  telegramUrl?: string | null
  websiteUrl?: string | null
  xUrl?: string | null
}

export type AdminOrganizationListResult = {
  limit: number
  offset: number
  organizations: AdminOrganization[]
  total: number
}

export type AdminOrganizationOwnerCandidate = {
  id: string
  name: string
  username?: string | null
}

export type AdminApiClient = {
  assetGroupCreate(input: AdminAssetGroupCreateInput): Promise<AdminAssetGroup>
  assetGroupDelete(input: { assetGroupId: string }): Promise<{ assetGroupId: string }>
  assetGroupGet(input: { assetGroupId: string }): Promise<AdminAssetGroup | null>
  assetGroupIndex(input: { assetGroupId: string }): Promise<JsonRecord>
  assetGroupList(input?: AdminAssetGroupListInput): Promise<AdminAssetGroupListResult>
  assetGroupListIndexRuns(input: AdminAssetGroupListIndexRunsInput): Promise<{ indexRuns: JsonRecord[] }>
  assetGroupLookup(input: AdminAssetGroupLookupInput): Promise<JsonRecord>
  assetGroupUpdate(input: { assetGroupId: string; data: AdminAssetGroupUpdateInput }): Promise<AdminAssetGroup>
  organizationCreate(input: AdminOrganizationCreateInput): Promise<AdminOrganization>
  organizationDelete(input: { organizationId: string }): Promise<{ organizationId: string }>
  organizationGet(input: { organizationId: string }): Promise<AdminOrganization | null>
  organizationList(input?: AdminOrganizationListInput): Promise<AdminOrganizationListResult>
  organizationListOwnerCandidates(
    input?: AdminOrganizationListOwnerCandidatesInput,
  ): Promise<AdminOrganizationOwnerCandidate[]>
  organizationUpdate(input: { organizationId: string; data: AdminOrganizationUpdateInput }): Promise<AdminOrganization>
}

type AdminApiClientOptions = ProfileOptions & {
  fetch?: AdminApiFetch
  signal?: AbortSignal
  verbose?: boolean
}

type AdminApiRequestDetails = {
  body?: string
  contentType?: string | null
  method: string
  status?: number
  statusText?: string
  transportError?: string
  url: string
}

type JsonRecord = Record<string, unknown>

const API_REFERENCE_PATH = '/api-reference'
const MAX_VERBOSE_RESPONSE_BODY_LENGTH = 2000

function getFetchImplementation(fetchImpl?: AdminApiFetch): AdminApiFetch {
  return fetchImpl ?? ((...args) => globalThis.fetch(...args))
}

function getRecord(value: unknown): JsonRecord | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonRecord) : undefined
}

function getErrorString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

function getErrorNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined
}

function getRequestMethod(input: Parameters<AdminApiFetch>[0], init: Parameters<AdminApiFetch>[1]): string {
  if (init?.method) {
    return init.method
  }

  if (typeof Request !== 'undefined' && input instanceof Request) {
    return input.method
  }

  return 'GET'
}

function getRequestUrl(input: Parameters<AdminApiFetch>[0]): string {
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

function getTransportErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message
  }

  if (typeof error === 'string' && error.trim()) {
    return error.trim()
  }

  return 'Request failed before receiving an HTTP response.'
}

function getTruncatedResponseBody(body: string): string {
  if (body.length <= MAX_VERBOSE_RESPONSE_BODY_LENGTH) {
    return body
  }

  return `${body.slice(0, MAX_VERBOSE_RESPONSE_BODY_LENGTH)}\n... truncated`
}

function getApiErrorDetails(input: { code?: string; response?: AdminApiRequestDetails; status?: number }): string[] {
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
  fetchImpl: AdminApiFetch | undefined,
  onFailure: (details: AdminApiRequestDetails) => void,
): AdminApiFetch {
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

function getApiErrorPayload(error: unknown): unknown {
  const record = getRecord(error)

  return record?.error ?? record?.cause ?? error
}

function getApiError(error: unknown, fallback: string) {
  const payload = getApiErrorPayload(error)
  const record = getRecord(payload)
  const errorRecord = getRecord(record?.error)
  const code =
    getErrorString(record?.code) ??
    getErrorString(errorRecord?.code) ??
    getErrorString(getRecord(error)?.code) ??
    getErrorString(record?.statusText)
  const message =
    getErrorString(record?.message) ??
    getErrorString(errorRecord?.message) ??
    getErrorString(record?.error) ??
    getErrorString(payload) ??
    (error instanceof Error && error.message ? error.message : fallback)
  const status = getErrorNumber(record?.status) ?? getErrorNumber(getRecord(error)?.status)

  return { code, message, status }
}

function toAdminApiError(error: unknown, fallback: string, response?: AdminApiRequestDetails) {
  const { code, message, status } = getApiError(error, fallback)

  return new AdminApiError(message, {
    code,
    details: response ? getApiErrorDetails({ code, response, status: status ?? response.status }) : undefined,
    status: status ?? response?.status,
  })
}

function resolveApiReferenceUrl(apiUrl: string): string {
  const normalizedApiUrl = apiUrl.endsWith('/') ? apiUrl.slice(0, -1) : apiUrl

  return `${normalizedApiUrl}${API_REFERENCE_PATH}`
}

function getGeneratedClient(input: { apiKey: string; apiUrl: string; fetch?: AdminApiFetch }) {
  const config: GeneratedClientConfig = {
    baseUrl: resolveApiReferenceUrl(input.apiUrl),
    headers: {
      'x-api-key': input.apiKey,
    },
    throwOnError: true,
  }

  if (input.fetch) {
    config.fetch = input.fetch as typeof fetch
  }

  return createClient(config)
}

function assertJsonRecord(value: unknown, fallback: string): JsonRecord {
  const record = getRecord(value)

  if (!record) {
    throw new AdminApiError(fallback)
  }

  return record
}

export function createAdminApiClient(options: AdminApiClientOptions = {}): AdminApiClient {
  const credentials = requireStoredAuthCredentials(options)
  const client = getGeneratedClient({
    apiKey: credentials.apiKey,
    apiUrl: credentials.apiUrl,
    fetch: options.fetch,
  })

  function getRequestClient(onFailure: (details: AdminApiRequestDetails) => void): GeneratedClient {
    if (!options.verbose) {
      return client
    }

    return getGeneratedClient({
      apiKey: credentials.apiKey,
      apiUrl: credentials.apiUrl,
      fetch: createVerboseFetch(options.fetch, onFailure),
    })
  }

  async function request<T>(callback: (generatedClient: GeneratedClient) => Promise<unknown>, fallback: string) {
    let responseDetails: AdminApiRequestDetails | undefined
    const requestClient = getRequestClient((details) => {
      responseDetails = details
    })

    try {
      return (await callback(requestClient)) as T
    } catch (error) {
      if (error instanceof AdminApiError) {
        throw error
      }

      throw toAdminApiError(error, fallback, responseDetails)
    }
  }

  const requestOptions = {
    signal: options.signal,
  }

  return {
    assetGroupCreate(input) {
      return request(
        (generatedClient) => adminAssetGroupCreate({ ...requestOptions, body: input, client: generatedClient }),
        'Unable to create asset group.',
      )
    },
    assetGroupDelete(input) {
      return request(
        (generatedClient) => adminAssetGroupDelete({ ...requestOptions, body: input, client: generatedClient }),
        'Unable to delete asset group.',
      )
    },
    assetGroupGet(input) {
      return request(
        (generatedClient) => adminAssetGroupGet({ ...requestOptions, body: input, client: generatedClient }),
        'Unable to load asset group.',
      )
    },
    assetGroupIndex(input) {
      return request(
        async (generatedClient) =>
          assertJsonRecord(
            await adminAssetGroupIndex({ ...requestOptions, body: input, client: generatedClient }),
            'Asset group index response was invalid.',
          ),
        'Unable to index asset group.',
      )
    },
    assetGroupList(input) {
      return request(
        (generatedClient) => adminAssetGroupList({ ...requestOptions, body: input, client: generatedClient }),
        'Unable to list asset groups.',
      )
    },
    assetGroupListIndexRuns(input) {
      return request(
        (generatedClient) => adminAssetGroupListIndexRuns({ ...requestOptions, body: input, client: generatedClient }),
        'Unable to list asset group index runs.',
      )
    },
    assetGroupLookup(input) {
      return request(
        async (generatedClient) =>
          assertJsonRecord(
            await adminAssetGroupLookup({ ...requestOptions, body: input, client: generatedClient }),
            'Asset group lookup response was invalid.',
          ),
        'Unable to look up asset group.',
      )
    },
    assetGroupUpdate(input) {
      return request(
        (generatedClient) => adminAssetGroupUpdate({ ...requestOptions, body: input, client: generatedClient }),
        'Unable to update asset group.',
      )
    },
    organizationCreate(input) {
      return request(
        (generatedClient) => adminOrganizationCreate({ ...requestOptions, body: input, client: generatedClient }),
        'Unable to create community.',
      )
    },
    organizationDelete(input) {
      return request(
        (generatedClient) => adminOrganizationDelete({ ...requestOptions, body: input, client: generatedClient }),
        'Unable to delete community.',
      )
    },
    organizationGet(input) {
      return request(
        (generatedClient) => adminOrganizationGet({ ...requestOptions, body: input, client: generatedClient }),
        'Unable to load community.',
      )
    },
    organizationList(input) {
      return request(
        (generatedClient) => adminOrganizationList({ ...requestOptions, body: input, client: generatedClient }),
        'Unable to list communities.',
      )
    },
    organizationListOwnerCandidates(input) {
      return request(
        (generatedClient) =>
          adminOrganizationListOwnerCandidates({ ...requestOptions, body: input, client: generatedClient }),
        'Unable to list community owner candidates.',
      )
    },
    organizationUpdate(input) {
      return request(
        (generatedClient) => adminOrganizationUpdate({ ...requestOptions, body: input, client: generatedClient }),
        'Unable to update community.',
      )
    },
  }
}

export const adminApiReferenceUrl = {
  resolve: resolveApiReferenceUrl,
}

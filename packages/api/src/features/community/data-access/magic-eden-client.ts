export interface MagicEdenBuyInput {
  buyer: string
  listing: MagicEdenListing
}

export type MagicEdenFetch = (input: Request | URL | string, init?: RequestInit) => Promise<Response>

export interface MagicEdenClientOptions {
  apiKey: string
  baseUrl: string
  fetch?: MagicEdenFetch
}

const MAGIC_EDEN_REQUEST_TIMEOUT_MS = 10_000

export class MagicEdenClientError extends Error {
  public constructor(message: string) {
    super(message)

    this.name = 'MagicEdenClientError'
  }
}

export interface MagicEdenListing {
  assetAddress: string
  auctionHouseAddress: string | null
  id: string
  imageUrl: string | null
  name: string | null
  priceSol: number
  seller: string
  sellerExpiry: number
  tokenAta: string
}

export interface MagicEdenPreparedTransaction {
  data: string
  encoding: 'base64'
}

function buildHeaders(apiKey: string) {
  return {
    Accept: 'application/json',
    Authorization: `Bearer ${apiKey}`,
  }
}

function isTimeoutError(error: unknown) {
  return error instanceof Error && (error.name === 'AbortError' || error.name === 'TimeoutError')
}

function buildListingId(input: {
  assetAddress: string
  auctionHouseAddress: string | null
  priceSol: number
  seller: string
  sellerExpiry: number
  tokenAta: string
}) {
  return [
    input.assetAddress,
    input.auctionHouseAddress ?? '',
    input.priceSol.toString(),
    input.seller,
    input.sellerExpiry.toString(),
    input.tokenAta,
  ].join(':')
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readArray(value: unknown) {
  if (Array.isArray(value)) {
    return value
  }

  if (isRecord(value) && Array.isArray(value.results)) {
    return value.results
  }

  if (isRecord(value) && Array.isArray(value.listings)) {
    return value.listings
  }

  return []
}

function readNumber(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()

    if (!trimmed) {
      return null
    }

    const parsed = Number(trimmed)

    return Number.isFinite(parsed) ? parsed : null
  }

  return null
}

function readPath(value: unknown, path: string[]) {
  let current = value

  for (const part of path) {
    if (!isRecord(current)) {
      return null
    }

    current = current[part]
  }

  return current
}

function readString(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : null
}

function readStringPath(value: unknown, paths: string[][]) {
  for (const path of paths) {
    const readValue = readString(readPath(value, path))

    if (readValue) {
      return readValue
    }
  }

  return null
}

function toBase64Transaction(value: unknown) {
  if (typeof value === 'string' && value.trim()) {
    return value.trim()
  }

  if (value instanceof Uint8Array) {
    return Buffer.from(value).toString('base64')
  }

  if (Array.isArray(value) && value.every((entry) => typeof entry === 'number')) {
    return Buffer.from(value).toString('base64')
  }

  if (isRecord(value) && Array.isArray(value.data) && value.data.every((entry) => typeof entry === 'number')) {
    return Buffer.from(value.data).toString('base64')
  }

  return null
}

function toMagicEdenListing(value: unknown): MagicEdenListing | null {
  const assetAddress = readStringPath(value, [
    ['assetAddress'],
    ['mintAddress'],
    ['token', 'id'],
    ['token', 'mint'],
    ['token', 'mintAddress'],
    ['tokenMint'],
    ['tokenMintAddress'],
  ])
  const auctionHouseAddress = readStringPath(value, [['auctionHouse'], ['auctionHouseAddress']])
  const imageUrl = readStringPath(value, [
    ['image'],
    ['imageUrl'],
    ['img'],
    ['token', 'image'],
    ['token', 'imageUrl'],
    ['token', 'img'],
  ])
  const name = readStringPath(value, [['name'], ['title'], ['token', 'name'], ['token', 'title']])
  const priceSol =
    readNumber(readPath(value, ['price'])) ??
    readNumber(readPath(value, ['listing', 'price'])) ??
    readNumber(readPath(value, ['listPrice']))
  const seller = readStringPath(value, [['seller'], ['sellerAddress']])
  const sellerExpiry = readNumber(readPath(value, ['sellerExpiry'])) ?? readNumber(readPath(value, ['expiry'])) ?? 0
  const tokenAta = readStringPath(value, [
    ['tokenATA'],
    ['tokenAta'],
    ['tokenAccount'],
    ['tokenAccountAddress'],
    ['tokenAddress'],
    ['token', 'tokenATA'],
    ['token', 'tokenAta'],
    ['token', 'tokenAccount'],
    ['token', 'tokenAddress'],
  ])

  if (!assetAddress || priceSol === null || !seller || !tokenAta) {
    return null
  }

  const listing = {
    assetAddress,
    auctionHouseAddress,
    id: readStringPath(value, [['id'], ['listingId'], ['pdaAddress']]) ?? '',
    imageUrl,
    name,
    priceSol,
    seller,
    sellerExpiry,
    tokenAta,
  }

  return {
    ...listing,
    id: listing.id || buildListingId(listing),
  }
}

function toPreparedTransaction(value: unknown): MagicEdenPreparedTransaction {
  const candidates = [
    readPath(value, ['txSigned']),
    readPath(value, ['tx']),
    readPath(value, ['transaction']),
    readPath(value, ['data']),
    value,
  ]

  for (const candidate of candidates) {
    const data = toBase64Transaction(candidate)

    if (data) {
      return {
        data,
        encoding: 'base64',
      }
    }
  }

  throw new MagicEdenClientError('Magic Eden did not return a transaction.')
}

export function createMagicEdenClient(options: MagicEdenClientOptions) {
  const fetchImplementation = options.fetch ?? fetch

  async function fetchJson(url: URL) {
    let response: Response

    try {
      response = await fetchImplementation(url, {
        headers: buildHeaders(options.apiKey),
        signal: AbortSignal.timeout(MAGIC_EDEN_REQUEST_TIMEOUT_MS),
      })
    } catch (error) {
      if (isTimeoutError(error)) {
        throw new MagicEdenClientError('Magic Eden request timed out.')
      }

      throw error
    }

    if (!response.ok) {
      throw new MagicEdenClientError(`Magic Eden request failed with status ${response.status}.`)
    }

    try {
      return await response.json()
    } catch (error) {
      if (isTimeoutError(error)) {
        throw new MagicEdenClientError('Magic Eden request timed out.')
      }

      throw error
    }
  }

  return {
    async getBuyNowTransaction(input: MagicEdenBuyInput): Promise<MagicEdenPreparedTransaction> {
      const url = new URL('/v2/instructions/buy_now', options.baseUrl)

      if (input.listing.auctionHouseAddress) {
        url.searchParams.set('auctionHouseAddress', input.listing.auctionHouseAddress)
      }

      url.searchParams.set('buyer', input.buyer)
      url.searchParams.set('price', input.listing.priceSol.toString())
      url.searchParams.set('seller', input.listing.seller)
      url.searchParams.set('sellerExpiry', input.listing.sellerExpiry.toString())
      url.searchParams.set('tokenATA', input.listing.tokenAta)
      url.searchParams.set('tokenMint', input.listing.assetAddress)

      return toPreparedTransaction(await fetchJson(url))
    },

    async listCollectionListings(input: { limit: number; symbolMagicEden: string }): Promise<MagicEdenListing[]> {
      const url = new URL(`/v2/collections/${encodeURIComponent(input.symbolMagicEden)}/listings`, options.baseUrl)

      url.searchParams.set('limit', input.limit.toString())
      url.searchParams.set('offset', '0')
      url.searchParams.set('sort', 'listPrice')
      url.searchParams.set('sort_direction', 'asc')

      return readArray(await fetchJson(url))
        .map(toMagicEdenListing)
        .filter((listing): listing is MagicEdenListing => Boolean(listing))
        .sort(
          (left, right) =>
            left.priceSol - right.priceSol ||
            (left.name ?? '').localeCompare(right.name ?? '') ||
            left.assetAddress.localeCompare(right.assetAddress),
        )
        .slice(0, input.limit)
    },
  }
}

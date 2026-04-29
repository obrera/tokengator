import { createHmac, timingSafeEqual } from 'node:crypto'

import type { MagicEdenListing } from './magic-eden-client'

const LISTING_VERIFICATION_LIFETIME_MS = 10 * 60 * 1000
const LISTING_VERIFICATION_VERSION = 'v1'

type CommunityAssetMarketplaceListingVerificationInput = {
  assetGroupId: string
  expiresAt: number
  listing: MagicEdenListing
  secret: string
  symbolMagicEden: string
}

export type CommunityAssetMarketplaceVerifiedListing = MagicEdenListing & {
  verification: string
}

function getListingVerificationPayload(input: CommunityAssetMarketplaceListingVerificationInput) {
  return JSON.stringify({
    assetAddress: input.listing.assetAddress,
    assetGroupId: input.assetGroupId,
    auctionHouseAddress: input.listing.auctionHouseAddress,
    expiresAt: input.expiresAt,
    id: input.listing.id,
    imageUrl: input.listing.imageUrl,
    name: input.listing.name,
    priceSol: input.listing.priceSol,
    seller: input.listing.seller,
    sellerExpiry: input.listing.sellerExpiry,
    symbolMagicEden: input.symbolMagicEden,
    tokenAta: input.listing.tokenAta,
  })
}

function getListingVerification(input: CommunityAssetMarketplaceListingVerificationInput) {
  return [
    LISTING_VERIFICATION_VERSION,
    input.expiresAt.toString(),
    createHmac('sha256', input.secret).update(getListingVerificationPayload(input)).digest('base64url'),
  ].join('.')
}

export function signCommunityAssetMarketplaceListing(
  input: Omit<CommunityAssetMarketplaceListingVerificationInput, 'expiresAt'>,
): CommunityAssetMarketplaceVerifiedListing {
  const expiresAt = Date.now() + LISTING_VERIFICATION_LIFETIME_MS

  return {
    ...input.listing,
    verification: getListingVerification({
      ...input,
      expiresAt,
    }),
  }
}

export function verifyCommunityAssetMarketplaceListing(input: {
  assetGroupId: string
  listing: CommunityAssetMarketplaceVerifiedListing
  secret: string
  symbolMagicEden: string
}) {
  const [version, expiresAtValue] = input.listing.verification.split('.', 3)
  const expiresAt = Number(expiresAtValue)

  if (version !== LISTING_VERIFICATION_VERSION || !Number.isFinite(expiresAt) || Date.now() > expiresAt) {
    return false
  }

  const expected = Buffer.from(
    getListingVerification({
      ...input,
      expiresAt,
    }),
  )
  const received = Buffer.from(input.listing.verification)

  return expected.length === received.length && timingSafeEqual(expected, received)
}

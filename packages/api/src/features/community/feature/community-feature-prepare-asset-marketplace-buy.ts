import { ORPCError } from '@orpc/server'
import { and, eq } from 'drizzle-orm'
import { db } from '@tokengator/db'
import { solanaWallet } from '@tokengator/db/schema/auth'

import { protectedProcedure } from '../../../lib/procedures'
import { communityPrepareAssetMarketplaceBuyInputSchema } from '../data-access/community-asset-marketplace-input-schemas'
import {
  verifyCommunityAssetMarketplaceListing,
  type CommunityAssetMarketplaceVerifiedListing,
} from '../data-access/community-asset-marketplace-listing-verification'
import { communityGetMarketplaceCollectionForUser } from '../data-access/community-asset-marketplace-lookup'
import { getMagicEdenConfig } from '../data-access/community-marketplace'
import { createMagicEdenClient, MagicEdenClientError } from '../data-access/magic-eden-client'

async function isLinkedBuyerWallet(input: { buyer: string; userId: string }) {
  const [record] = await db
    .select({
      id: solanaWallet.id,
    })
    .from(solanaWallet)
    .where(and(eq(solanaWallet.address, input.buyer), eq(solanaWallet.userId, input.userId)))
    .limit(1)

  return Boolean(record)
}

function toCommunityMarketplaceListing(listing: CommunityAssetMarketplaceVerifiedListing) {
  return {
    assetAddress: listing.assetAddress,
    auctionHouseAddress: listing.auctionHouseAddress,
    id: listing.id,
    imageUrl: listing.imageUrl,
    name: listing.name,
    priceSol: listing.priceSol,
    seller: listing.seller,
    sellerExpiry: listing.sellerExpiry,
    tokenAta: listing.tokenAta,
    verification: listing.verification,
  }
}

export const communityFeaturePrepareAssetMarketplaceBuy = protectedProcedure
  .input(communityPrepareAssetMarketplaceBuyInputSchema)
  .handler(async ({ context, input }) => {
    const magicEdenConfig = getMagicEdenConfig()

    if (!magicEdenConfig) {
      throw new ORPCError('BAD_REQUEST', {
        message: 'Magic Eden purchases are not configured.',
      })
    }

    const collectionLookup = await communityGetMarketplaceCollectionForUser({
      assetGroupId: input.assetGroupId,
      slug: input.slug,
      userId: context.session.user.id,
    })

    if (collectionLookup.status === 'collection-not-found' || collectionLookup.status === 'community-not-found') {
      throw new ORPCError('NOT_FOUND', {
        message: collectionLookup.message,
      })
    }

    if (collectionLookup.status !== 'ok') {
      throw new ORPCError('BAD_REQUEST', {
        message: collectionLookup.message,
      })
    }

    if (
      !(await isLinkedBuyerWallet({
        buyer: input.buyer,
        userId: context.session.user.id,
      }))
    ) {
      throw new ORPCError('FORBIDDEN', {
        message: 'Buyer wallet is not linked to your profile.',
      })
    }

    try {
      const client = createMagicEdenClient(magicEdenConfig)
      const listing = input.listing

      if (
        !verifyCommunityAssetMarketplaceListing({
          assetGroupId: collectionLookup.assetGroup.id,
          listing,
          secret: magicEdenConfig.listingSecret,
          symbolMagicEden: collectionLookup.assetGroup.symbolMagicEden!,
        })
      ) {
        throw new ORPCError('BAD_REQUEST', {
          message: 'Magic Eden listing is not valid for this community collection.',
        })
      }

      return {
        listing: toCommunityMarketplaceListing(listing),
        transaction: await client.getBuyNowTransaction({
          buyer: input.buyer,
          listing,
        }),
      }
    } catch (error) {
      if (error instanceof ORPCError) {
        throw error
      }

      if (error instanceof MagicEdenClientError) {
        throw new ORPCError('BAD_REQUEST', {
          message: error.message,
        })
      }

      throw error
    }
  })

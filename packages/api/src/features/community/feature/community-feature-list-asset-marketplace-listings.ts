import { ORPCError } from '@orpc/server'

import { protectedProcedure } from '../../../lib/procedures'
import { communityListAssetMarketplaceListingsInputSchema } from '../data-access/community-asset-marketplace-input-schemas'
import {
  signCommunityAssetMarketplaceListing,
  type CommunityAssetMarketplaceVerifiedListing,
} from '../data-access/community-asset-marketplace-listing-verification'
import { communityGetMarketplaceCollectionForUser } from '../data-access/community-asset-marketplace-lookup'
import { getMagicEdenConfig } from '../data-access/community-marketplace'
import { createMagicEdenClient, MagicEdenClientError } from '../data-access/magic-eden-client'

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

export const communityFeatureListAssetMarketplaceListings = protectedProcedure
  .input(communityListAssetMarketplaceListingsInputSchema)
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

    try {
      const listings = await createMagicEdenClient(magicEdenConfig).listCollectionListings({
        limit: input.limit,
        symbolMagicEden: collectionLookup.assetGroup.symbolMagicEden!,
      })

      return {
        assetGroup: {
          address: collectionLookup.assetGroup.address,
          id: collectionLookup.assetGroup.id,
          imageUrl: collectionLookup.assetGroup.imageUrl,
          label: collectionLookup.assetGroup.label,
          symbolMagicEden: collectionLookup.assetGroup.symbolMagicEden!,
        },
        listings: listings.map((listing) =>
          toCommunityMarketplaceListing(
            signCommunityAssetMarketplaceListing({
              assetGroupId: collectionLookup.assetGroup.id,
              listing,
              secret: magicEdenConfig.listingSecret,
              symbolMagicEden: collectionLookup.assetGroup.symbolMagicEden!,
            }),
          ),
        ),
      }
    } catch (error) {
      if (error instanceof MagicEdenClientError) {
        throw new ORPCError('BAD_REQUEST', {
          message: error.message,
        })
      }

      throw error
    }
  })

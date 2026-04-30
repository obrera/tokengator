import z from 'zod'

const communityAssetMarketplaceListingInputSchema = z.object({
  assetAddress: z.string().trim().min(1),
  auctionHouseAddress: z.string().trim().nullable(),
  id: z.string().trim().min(1),
  imageUrl: z.string().trim().nullable(),
  name: z.string().trim().nullable(),
  priceSol: z.number().positive(),
  seller: z.string().trim().min(1),
  sellerExpiry: z.number().int().min(-1),
  tokenAta: z.string().trim().min(1),
  verification: z.string().trim().min(1),
})

export const communityListAssetMarketplaceListingsInputSchema = z.object({
  assetGroupId: z.string().trim().min(1),
  limit: z.number().int().min(1).max(100).default(100),
  slug: z.string().trim().min(1),
})

export const communityPrepareAssetMarketplaceBuyInputSchema = z.object({
  assetGroupId: z.string().trim().min(1),
  buyer: z.string().trim().min(1),
  listing: communityAssetMarketplaceListingInputSchema,
  slug: z.string().trim().min(1),
})

export const communityRefreshAssetMarketplaceAccessInputSchema = z.object({
  assetGroupId: z.string().trim().min(1),
  signature: z.string().trim().min(1),
  slug: z.string().trim().min(1),
})

import { communityFeatureGetBySlug } from './community-feature-get-by-slug'
import { communityFeatureGetCollectionAsset } from './community-feature-get-collection-asset'
import { communityFeatureList } from './community-feature-list'
import { communityFeatureListAssetMarketplaceListings } from './community-feature-list-asset-marketplace-listings'
import { communityFeatureListCollectionAssets } from './community-feature-list-collection-assets'
import { communityFeatureListCollectionOwnerCandidates } from './community-feature-list-collection-owner-candidates'
import { communityFeaturePrepareAssetMarketplaceBuy } from './community-feature-prepare-asset-marketplace-buy'
import { communityFeatureRefreshAssetMarketplaceAccess } from './community-feature-refresh-asset-marketplace-access'

export const communityRouter = {
  getBySlug: communityFeatureGetBySlug,
  getCollectionAsset: communityFeatureGetCollectionAsset,
  list: communityFeatureList,
  listAssetMarketplaceListings: communityFeatureListAssetMarketplaceListings,
  listCollectionAssets: communityFeatureListCollectionAssets,
  listCollectionOwnerCandidates: communityFeatureListCollectionOwnerCandidates,
  prepareAssetMarketplaceBuy: communityFeaturePrepareAssetMarketplaceBuy,
  refreshAssetMarketplaceAccess: communityFeatureRefreshAssetMarketplaceAccess,
}

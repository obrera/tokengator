import { communityFeatureGetBySlug } from './community-feature-get-by-slug'
import { communityFeatureGetCollectionAsset } from './community-feature-get-collection-asset'
import { communityFeatureGetCollectionInsights } from './community-feature-get-collection-insights'
import { communityFeatureList } from './community-feature-list'
import { communityFeatureListAssetMarketplaceListings } from './community-feature-list-asset-marketplace-listings'
import { communityFeatureListCollectionAssets } from './community-feature-list-collection-assets'
import { communityFeatureListCollectionLeaderboard } from './community-feature-list-collection-leaderboard'
import { communityFeatureListCollectionOwnerCandidates } from './community-feature-list-collection-owner-candidates'
import { communityFeaturePrepareAssetMarketplaceBuy } from './community-feature-prepare-asset-marketplace-buy'
import { communityFeatureRefreshAssetMarketplaceAccess } from './community-feature-refresh-asset-marketplace-access'

export const communityRouter = {
  getBySlug: communityFeatureGetBySlug,
  getCollectionAsset: communityFeatureGetCollectionAsset,
  getCollectionInsights: communityFeatureGetCollectionInsights,
  list: communityFeatureList,
  listAssetMarketplaceListings: communityFeatureListAssetMarketplaceListings,
  listCollectionAssets: communityFeatureListCollectionAssets,
  listCollectionLeaderboard: communityFeatureListCollectionLeaderboard,
  listCollectionOwnerCandidates: communityFeatureListCollectionOwnerCandidates,
  prepareAssetMarketplaceBuy: communityFeaturePrepareAssetMarketplaceBuy,
  refreshAssetMarketplaceAccess: communityFeatureRefreshAssetMarketplaceAccess,
}

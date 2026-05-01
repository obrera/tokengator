import { adminUserFeatureCreate } from './admin-user-feature-create'
import { adminUserFeatureDeleteSolanaWallet } from './admin-user-feature-delete-solana-wallet'
import { adminUserFeatureGet } from './admin-user-feature-get'
import { adminUserFeatureLinkDiscordAccount } from './admin-user-feature-link-discord-account'
import { adminUserFeatureLinkSolanaWallet } from './admin-user-feature-link-solana-wallet'
import { adminUserFeatureList } from './admin-user-feature-list'
import { adminUserFeatureListAssets } from './admin-user-feature-list-assets'
import { adminUserFeatureListCommunities } from './admin-user-feature-list-communities'
import { adminUserFeatureListIdentities } from './admin-user-feature-list-identities'
import { adminUserFeatureRemoveCommunityMembership } from './admin-user-feature-remove-community-membership'
import { adminUserFeatureSetPrimarySolanaWallet } from './admin-user-feature-set-primary-solana-wallet'
import { adminUserFeatureUpdate } from './admin-user-feature-update'
import { adminUserFeatureUpdateCommunityMembership } from './admin-user-feature-update-community-membership'
import { adminUserFeatureUpdateSolanaWallet } from './admin-user-feature-update-solana-wallet'

export const adminUserRouter = {
  create: adminUserFeatureCreate,
  deleteSolanaWallet: adminUserFeatureDeleteSolanaWallet,
  get: adminUserFeatureGet,
  linkDiscordAccount: adminUserFeatureLinkDiscordAccount,
  linkSolanaWallet: adminUserFeatureLinkSolanaWallet,
  list: adminUserFeatureList,
  listAssets: adminUserFeatureListAssets,
  listCommunities: adminUserFeatureListCommunities,
  listIdentities: adminUserFeatureListIdentities,
  removeCommunityMembership: adminUserFeatureRemoveCommunityMembership,
  setPrimarySolanaWallet: adminUserFeatureSetPrimarySolanaWallet,
  update: adminUserFeatureUpdate,
  updateCommunityMembership: adminUserFeatureUpdateCommunityMembership,
  updateSolanaWallet: adminUserFeatureUpdateSolanaWallet,
}

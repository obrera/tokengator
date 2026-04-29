import { env } from '@tokengator/env/api'

import type {
  CommunityMarketplaceAvailabilityEntity,
  CommunityRoleAssetMarketplaceEntity,
  CommunityRoleEntity,
} from './community.entity'

const MAGIC_EDEN_BASE_URL_BY_CLUSTER = {
  devnet: 'https://api-devnet.magiceden.dev',
  mainnet: 'https://api-mainnet.magiceden.dev',
} as const

function getMagicEdenApiKey() {
  return process.env.MAGIC_EDEN_API_KEY?.trim() || env.MAGIC_EDEN_API_KEY
}

function getMagicEdenListingSecret() {
  return process.env.MAGIC_EDEN_LISTING_SECRET?.trim() || env.MAGIC_EDEN_LISTING_SECRET
}

function getMagicEdenAvailability(): CommunityMarketplaceAvailabilityEntity['magicEden'] {
  const apiKey = getMagicEdenApiKey()
  const listingSecret = getMagicEdenListingSecret()
  const solanaCluster = env.SOLANA_CLUSTER

  if (!apiKey) {
    return {
      enabled: false,
      unavailableReason: 'api-key-missing',
    }
  }

  if (!listingSecret) {
    return {
      enabled: false,
      unavailableReason: 'listing-secret-missing',
    }
  }

  if (solanaCluster !== 'devnet' && solanaCluster !== 'mainnet') {
    return {
      enabled: false,
      unavailableReason: 'cluster-unsupported',
    }
  }

  return {
    enabled: true,
    unavailableReason: null,
  }
}

export function getMagicEdenConfig() {
  const availability = getMagicEdenAvailability()
  const apiKey = getMagicEdenApiKey()
  const listingSecret = getMagicEdenListingSecret()
  const solanaCluster = env.SOLANA_CLUSTER

  if (
    !availability.enabled ||
    !apiKey ||
    !listingSecret ||
    (solanaCluster !== 'devnet' && solanaCluster !== 'mainnet')
  ) {
    return null
  }

  return {
    apiKey,
    baseUrl: MAGIC_EDEN_BASE_URL_BY_CLUSTER[solanaCluster],
    listingSecret,
  }
}

export function getMarketplaceAvailability(): CommunityMarketplaceAvailabilityEntity {
  return {
    magicEden: getMagicEdenAvailability(),
  }
}

function getRoleAssetMarketplaceAssetGroup(role: Pick<CommunityRoleEntity, 'assetGroups'>) {
  if (role.assetGroups.length !== 1) {
    return null
  }

  const [assetGroup] = role.assetGroups

  if (!assetGroup) {
    return null
  }

  if (assetGroup.maximumAmount !== null || assetGroup.minimumAmount !== '1' || assetGroup.type !== 'collection') {
    return null
  }

  return assetGroup
}

export function getCommunityRoleAssetMarketplace(input: {
  assigned: boolean
  magicEdenAvailability: CommunityMarketplaceAvailabilityEntity['magicEden']
  role: Pick<CommunityRoleEntity, 'assetGroups'>
}): CommunityRoleAssetMarketplaceEntity {
  const assetGroup = getRoleAssetMarketplaceAssetGroup(input.role)

  if (input.assigned) {
    return {
      assetGroupId: assetGroup?.id ?? null,
      enabled: false,
      unavailableReason: 'already-assigned',
    }
  }

  if (!input.magicEdenAvailability.enabled) {
    return {
      assetGroupId: assetGroup?.id ?? null,
      enabled: false,
      unavailableReason: input.magicEdenAvailability.unavailableReason ?? 'api-key-missing',
    }
  }

  if (!assetGroup) {
    return {
      assetGroupId: null,
      enabled: false,
      unavailableReason: 'unsupported-role-requirement',
    }
  }

  if (!assetGroup.symbolMagicEden) {
    return {
      assetGroupId: assetGroup.id,
      enabled: false,
      unavailableReason: 'missing-symbol',
    }
  }

  return {
    assetGroupId: assetGroup.id,
    enabled: true,
    unavailableReason: null,
  }
}

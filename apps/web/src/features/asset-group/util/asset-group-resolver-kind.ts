import type { AdminAssetGroupResolverKind as ResolverKind } from '@tokengator/sdk'

export function getAssetGroupResolverKindLabel(resolverKind: ResolverKind) {
  if (resolverKind === 'helius-collection-assets') {
    return 'Collection Assets'
  }

  if (resolverKind === 'realms-voters') {
    return 'Realms Governance Power'
  }

  return 'Mint Token Accounts'
}

export function getAssetGroupResolverKindShortLabel(resolverKind: ResolverKind) {
  if (resolverKind === 'helius-collection-assets') {
    return 'Collection'
  }

  if (resolverKind === 'realms-voters') {
    return 'Realms'
  }

  return 'Mint'
}

export function getDefaultAssetGroupResolverKind(type: 'collection' | 'mint'): ResolverKind {
  return type === 'collection' ? 'helius-collection-assets' : 'helius-token-accounts'
}

export function getSupportedAssetGroupResolverKinds(type: 'collection' | 'mint'): ResolverKind[] {
  return type === 'collection' ? ['helius-collection-assets'] : ['helius-token-accounts', 'realms-voters']
}

export function isAssetGroupResolverKindCompatible(input: { resolverKind: ResolverKind; type: 'collection' | 'mint' }) {
  return getSupportedAssetGroupResolverKinds(input.type).includes(input.resolverKind)
}

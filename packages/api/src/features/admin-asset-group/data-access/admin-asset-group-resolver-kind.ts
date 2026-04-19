import z from 'zod'
import {
  HELIUS_COLLECTION_ASSETS,
  HELIUS_TOKEN_ACCOUNTS,
  REALMS_VOTERS,
  RESOLVER_KINDS,
  type ResolverKind,
} from '@tokengator/indexer'

import type { AdminAssetGroupType } from './admin-asset-group-type'

export const adminAssetGroupResolverKindSchema = z.enum(RESOLVER_KINDS)

export type AdminAssetGroupResolverKind = z.infer<typeof adminAssetGroupResolverKindSchema>

export function getAdminAssetGroupResolverKinds(type: AdminAssetGroupType): AdminAssetGroupResolverKind[] {
  switch (type) {
    case 'collection':
      return [HELIUS_COLLECTION_ASSETS]
    case 'mint':
      return [HELIUS_TOKEN_ACCOUNTS, REALMS_VOTERS]
  }
}

export function getDefaultAdminAssetGroupResolverKind(type: AdminAssetGroupType): AdminAssetGroupResolverKind {
  switch (type) {
    case 'collection':
      return HELIUS_COLLECTION_ASSETS
    case 'mint':
      return HELIUS_TOKEN_ACCOUNTS
  }
}

export function isAdminAssetGroupResolverKindCompatible(input: {
  resolverKind: ResolverKind
  type: AdminAssetGroupType
}) {
  return getAdminAssetGroupResolverKinds(input.type).includes(input.resolverKind)
}

export function normalizeAdminAssetGroupResolverKind(input: {
  resolverKind?: AdminAssetGroupResolverKind | null
  type: AdminAssetGroupType
}): AdminAssetGroupResolverKind {
  const resolverKind = input.resolverKind ?? getDefaultAdminAssetGroupResolverKind(input.type)

  if (!isAdminAssetGroupResolverKindCompatible({ resolverKind, type: input.type })) {
    throw new Error(`Resolver kind ${resolverKind} is incompatible with asset group type ${input.type}.`)
  }

  return resolverKind
}

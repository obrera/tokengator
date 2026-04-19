export const HELIUS_COLLECTION_ASSETS = 'helius-collection-assets'
export const HELIUS_TOKEN_ACCOUNTS = 'helius-token-accounts'
export const REALMS_VOTERS = 'realms-voters'

export const RESOLVER_KINDS = [HELIUS_COLLECTION_ASSETS, HELIUS_TOKEN_ACCOUNTS, REALMS_VOTERS] as const
export type ResolverKind = (typeof RESOLVER_KINDS)[number]

import type { CommunityGetBySlugResult } from '@tokengator/sdk'

export type CommunityAssetMarketplaceAssetGroup = Pick<
  CommunityGetBySlugResult['roles'][number]['assetGroups'][number],
  'address' | 'id' | 'imageUrl' | 'label' | 'symbolMagicEden' | 'type'
>
export type CommunityCollectionAssetMarketplaceAvailability =
  CommunityGetBySlugResult['collections'][number]['assetMarketplace']
export type CommunityMarketplaceAvailability = CommunityGetBySlugResult['marketplace']

export function isCommunityAssetMarketplaceEnabled({
  assetGroup,
  assetMarketplace,
  marketplace,
}: {
  assetGroup: CommunityAssetMarketplaceAssetGroup
  assetMarketplace: CommunityCollectionAssetMarketplaceAvailability | null
  marketplace: CommunityMarketplaceAvailability
}) {
  return (
    assetGroup.type === 'collection' &&
    Boolean(assetGroup.symbolMagicEden) &&
    Boolean(assetMarketplace?.enabled) &&
    assetMarketplace?.assetGroupId === assetGroup.id &&
    marketplace.magicEden.enabled
  )
}

export function getCommunityCollectionAssetMarketplace({
  community,
  selectedCollection,
}: {
  community: CommunityGetBySlugResult
  selectedCollection: CommunityGetBySlugResult['collections'][number]
}) {
  if (
    isCommunityAssetMarketplaceEnabled({
      assetGroup: selectedCollection,
      assetMarketplace: selectedCollection.assetMarketplace,
      marketplace: community.marketplace,
    })
  ) {
    return {
      assetGroup: selectedCollection,
      assetMarketplace: selectedCollection.assetMarketplace,
    }
  }

  return null
}

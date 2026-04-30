import type { CommunityGetBySlugResult } from '@tokengator/sdk'

import { SolanaProvider } from '@/lib/solana-provider'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tokengator/ui/components/card'

import { getCommunityCollectionAssetMarketplace } from '../util/community-asset-marketplace'
import { CommunityFeatureAssetMarketplaceBrowser } from './community-feature-asset-marketplace'

export function CommunityFeatureCollectionMarketplace({
  initialCommunity,
  selectedCollection,
}: {
  initialCommunity: CommunityGetBySlugResult
  selectedCollection: CommunityGetBySlugResult['collections'][number]
}) {
  const marketplace = getCommunityCollectionAssetMarketplace({
    community: initialCommunity,
    selectedCollection,
  })

  if (!marketplace) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Marketplace Unavailable</CardTitle>
          <CardDescription>This collection is not available for marketplace purchases.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Marketplace</CardTitle>
        <CardDescription>{selectedCollection.label} listings on Magic Eden.</CardDescription>
      </CardHeader>
      <CardContent>
        <SolanaProvider>
          <CommunityFeatureAssetMarketplaceBrowser
            assetGroup={marketplace.assetGroup}
            assetMarketplace={marketplace.assetMarketplace}
            slug={initialCommunity.slug}
          />
        </SolanaProvider>
      </CardContent>
    </Card>
  )
}

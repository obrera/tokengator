import type { ReactNode } from 'react'
import type { CommunityGetBySlugResult } from '@tokengator/sdk'

import { Card, CardDescription, CardHeader, CardTitle } from '@tokengator/ui/components/card'

import type { CommunityCollectionAssetSearch } from '../util/community-collection-asset-search'

import { CommunityFeatureCollectionShell } from './community-feature-collection-shell'

export function CommunityFeatureCollectionDetail({
  address,
  children,
  initialCommunity,
  search,
}: {
  address: string
  children: ReactNode
  initialCommunity: CommunityGetBySlugResult
  search: CommunityCollectionAssetSearch
}) {
  const selectedCollection = initialCommunity.collections.find((collection) => collection.address === address)

  if (!selectedCollection) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Collection Not Found</CardTitle>
          <CardDescription>The requested collection is not linked to this community.</CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <CommunityFeatureCollectionShell
      collections={initialCommunity.collections}
      search={search}
      selectedCollection={selectedCollection}
      slug={initialCommunity.slug}
    >
      {children}
    </CommunityFeatureCollectionShell>
  )
}

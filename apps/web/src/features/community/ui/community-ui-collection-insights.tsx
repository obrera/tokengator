import { useState } from 'react'
import type { CommunityCollectionEntity, CommunityGetCollectionInsightsResult } from '@tokengator/sdk'

import { Button } from '@tokengator/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tokengator/ui/components/card'
import { UiInfoCard, UiInfoCardLabel, UiInfoCardMeta, UiInfoCardValue } from '@tokengator/ui/components/ui-info-card'

const COMMUNITY_COLLECTION_INSIGHTS_OPTION_PREVIEW_LIMIT = 20

function formatCommunityCollectionInsightsPercentage(total: number, assetTotal: number) {
  if (assetTotal <= 0) {
    return '0%'
  }

  return `${Math.round((total / assetTotal) * 100)}%`
}

function getCommunityCollectionInsightsPercentage(total: number, assetTotal: number) {
  if (assetTotal <= 0) {
    return 0
  }

  return Math.min(100, Math.max(0, Math.round((total / assetTotal) * 100)))
}

function CommunityCollectionInsightsEmptyState({ assetTotal }: { assetTotal: number }) {
  return (
    <div className="border p-6">
      <div className="font-medium">{assetTotal === 0 ? 'No indexed assets' : 'No indexed traits'}</div>
      <div className="text-muted-foreground text-sm">
        {assetTotal === 0
          ? 'This collection does not have indexed assets yet.'
          : 'Indexed assets were found, but no trait data is available yet.'}
      </div>
    </div>
  )
}

function CommunityCollectionInsightsTraitGroupCard({
  assetTotal,
  traitGroup,
}: {
  assetTotal: number
  traitGroup: CommunityGetCollectionInsightsResult['traitGroups'][number]
}) {
  const [isExpanded, setIsExpanded] = useState(false)
  const visibleOptions = isExpanded
    ? traitGroup.options
    : traitGroup.options.slice(0, COMMUNITY_COLLECTION_INSIGHTS_OPTION_PREVIEW_LIMIT)
  const remainingOptionCount = traitGroup.options.length - visibleOptions.length

  return (
    <Card>
      <CardHeader>
        <CardTitle>{traitGroup.label}</CardTitle>
        <CardDescription>
          {traitGroup.total} of {assetTotal} assets have this trait group
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3">
        {visibleOptions.map((option) => {
          const percentage = getCommunityCollectionInsightsPercentage(option.total, assetTotal)

          return (
            <div className="grid gap-2" key={option.value}>
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-3 text-sm">
                <div className="truncate font-medium">{option.label}</div>
                <div className="text-muted-foreground text-xs">
                  {option.total} / {formatCommunityCollectionInsightsPercentage(option.total, assetTotal)}
                </div>
              </div>
              <div className="bg-muted h-2 overflow-hidden rounded-sm">
                <div className="bg-primary h-full rounded-sm" style={{ width: `${percentage}%` }} />
              </div>
            </div>
          )
        })}
        {remainingOptionCount > 0 ? (
          <Button className="justify-self-start" onClick={() => setIsExpanded(true)} type="button" variant="outline">
            Show {remainingOptionCount} more
          </Button>
        ) : null}
      </CardContent>
    </Card>
  )
}

export function CommunityUiCollectionInsights({
  insights,
  selectedCollection,
}: {
  insights: CommunityGetCollectionInsightsResult
  selectedCollection: CommunityCollectionEntity
}) {
  return (
    <div className="grid gap-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <UiInfoCard>
          <UiInfoCardLabel>Collection</UiInfoCardLabel>
          <UiInfoCardValue className="font-medium">{selectedCollection.label}</UiInfoCardValue>
          <UiInfoCardMeta className="font-mono break-all">{selectedCollection.address}</UiInfoCardMeta>
        </UiInfoCard>
        <UiInfoCard>
          <UiInfoCardLabel>Assets</UiInfoCardLabel>
          <UiInfoCardValue className="font-medium">{insights.assetTotal}</UiInfoCardValue>
          <UiInfoCardMeta>Indexed NFTs</UiInfoCardMeta>
        </UiInfoCard>
        <UiInfoCard>
          <UiInfoCardLabel>Trait Groups</UiInfoCardLabel>
          <UiInfoCardValue className="font-medium">{insights.traitGroups.length}</UiInfoCardValue>
          <UiInfoCardMeta>Indexed attribute groups</UiInfoCardMeta>
        </UiInfoCard>
      </div>
      {insights.traitGroups.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {insights.traitGroups.map((traitGroup) => (
            <CommunityCollectionInsightsTraitGroupCard
              assetTotal={insights.assetTotal}
              key={traitGroup.groupId}
              traitGroup={traitGroup}
            />
          ))}
        </div>
      ) : (
        <CommunityCollectionInsightsEmptyState assetTotal={insights.assetTotal} />
      )}
    </div>
  )
}

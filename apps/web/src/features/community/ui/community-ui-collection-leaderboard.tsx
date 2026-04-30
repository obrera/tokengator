import { Link } from '@tanstack/react-router'
import type { CommunityCollectionEntity, CommunityListCollectionLeaderboardResult } from '@tokengator/sdk'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@tokengator/ui/components/accordion'
import { Button } from '@tokengator/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tokengator/ui/components/card'
import { UiInfoCard, UiInfoCardLabel, UiInfoCardMeta, UiInfoCardValue } from '@tokengator/ui/components/ui-info-card'

function getCommunityCollectionLeaderboardHolderDescription(
  holder: CommunityListCollectionLeaderboardResult['holders'][number],
) {
  if (holder.kind === 'user' && holder.user) {
    return holder.user.username ? holder.user.name : 'Linked TokenGator profile'
  }

  return 'Unlinked wallet'
}

function getCommunityCollectionLeaderboardAssetTitle(
  asset: CommunityListCollectionLeaderboardResult['holders'][number]['wallets'][number]['assets'][number],
) {
  return asset.metadataName?.trim() || asset.address
}

function getCommunityCollectionLeaderboardOwnerSearch(
  _holder: CommunityListCollectionLeaderboardResult['holders'][number],
  wallet: CommunityListCollectionLeaderboardResult['holders'][number]['wallets'][number],
) {
  return wallet.address
}

function CommunityCollectionLeaderboardAssetGrid({
  assets,
  owner,
  selectedCollection,
  slug,
}: {
  assets: CommunityListCollectionLeaderboardResult['holders'][number]['wallets'][number]['assets']
  owner: string
  selectedCollection: CommunityCollectionEntity
  slug: string
}) {
  if (assets.length === 0) {
    return <div className="text-muted-foreground border p-3 text-xs">No indexed NFTs found for this wallet.</div>
  }

  return (
    <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
      {assets.map((asset) => {
        const title = getCommunityCollectionLeaderboardAssetTitle(asset)

        return (
          <Link
            className="bg-card hover:border-primary/60 focus-visible:ring-ring grid min-w-0 gap-1 rounded-md border p-1.5 transition-colors focus-visible:ring-2 focus-visible:outline-none"
            key={asset.id}
            params={{
              address: selectedCollection.address,
              asset: asset.address,
              slug,
            }}
            search={{
              grid: 8,
              owner,
            }}
            to="/communities/$slug/collections/$address/asset/$asset"
          >
            {asset.metadataImageUrl ? (
              <img
                alt={title}
                className="aspect-square w-full rounded-sm object-cover"
                loading="lazy"
                src={asset.metadataImageUrl}
              />
            ) : (
              <div className="bg-muted aspect-square w-full rounded-sm" />
            )}
            <span className="line-clamp-2 text-xs leading-tight font-medium">{title}</span>
          </Link>
        )
      })}
    </div>
  )
}

export function CommunityUiCollectionLeaderboard({
  canShowMore,
  isShowingMore,
  leaderboard,
  onShowMore,
  selectedCollection,
  slug,
}: {
  canShowMore?: boolean
  isShowingMore?: boolean
  leaderboard: CommunityListCollectionLeaderboardResult
  onShowMore?: () => void
  selectedCollection: CommunityCollectionEntity
  slug: string
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
          <UiInfoCardValue className="font-medium">{leaderboard.assetTotal}</UiInfoCardValue>
          <UiInfoCardMeta>Indexed NFTs</UiInfoCardMeta>
        </UiInfoCard>
        <UiInfoCard>
          <UiInfoCardLabel>Holders</UiInfoCardLabel>
          <UiInfoCardValue className="font-medium">{leaderboard.holderTotal}</UiInfoCardValue>
          <UiInfoCardMeta>{leaderboard.holders.length} shown</UiInfoCardMeta>
        </UiInfoCard>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Leaderboard</CardTitle>
          <CardDescription>Top holders ranked by indexed collection NFTs.</CardDescription>
        </CardHeader>
        <CardContent>
          {leaderboard.holders.length > 0 ? (
            <div className="grid gap-4">
              <Accordion className="rounded-none border-0" defaultValue={[]} multiple>
                {leaderboard.holders.map((holder) => (
                  <AccordionItem key={holder.holderId} value={holder.holderId}>
                    <AccordionTrigger className="items-center gap-3 p-3 hover:no-underline">
                      <span className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                        <span className="text-muted-foreground w-8 text-left text-xs">#{holder.rank}</span>
                        <span className="grid min-w-0 gap-1">
                          <span className="truncate font-medium">{holder.displayName}</span>
                          <span className="text-muted-foreground truncate text-xs">
                            {getCommunityCollectionLeaderboardHolderDescription(holder)}
                          </span>
                        </span>
                        <span className="text-muted-foreground text-xs">
                          {holder.assetTotal} NFT{holder.assetTotal === 1 ? '' : 's'}
                        </span>
                      </span>
                    </AccordionTrigger>
                    <AccordionContent className="grid gap-2 px-3 pb-3">
                      {holder.wallets.map((wallet) => (
                        <div className="grid gap-3 rounded-md border p-3" key={wallet.address}>
                          <div className="grid gap-1 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
                            <div className="grid min-w-0 gap-1">
                              <div className="font-mono text-xs break-all">{wallet.address}</div>
                              {wallet.name ? <div className="text-muted-foreground text-xs">{wallet.name}</div> : null}
                            </div>
                            <div className="text-muted-foreground text-xs">
                              {wallet.assetTotal} NFT{wallet.assetTotal === 1 ? '' : 's'}
                            </div>
                          </div>
                          <CommunityCollectionLeaderboardAssetGrid
                            assets={wallet.assets}
                            owner={getCommunityCollectionLeaderboardOwnerSearch(holder, wallet)}
                            selectedCollection={selectedCollection}
                            slug={slug}
                          />
                        </div>
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              {canShowMore && onShowMore ? (
                <div className="flex justify-center border-t pt-4">
                  <Button disabled={isShowingMore} onClick={onShowMore} type="button" variant="outline">
                    {isShowingMore ? 'Loading...' : 'Show more'}
                  </Button>
                </div>
              ) : null}
            </div>
          ) : (
            <div className="border p-6">
              <div className="font-medium">No holders found</div>
              <div className="text-muted-foreground text-sm">This collection does not have indexed holders yet.</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

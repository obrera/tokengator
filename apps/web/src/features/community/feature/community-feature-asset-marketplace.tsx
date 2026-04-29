import { getBase58Decoder } from '@solana/kit'
import { useSignAndSendTransaction, useWalletUi, type UiWalletAccount } from '@wallet-ui/react'
import { ArrowLeft, Loader2, ShoppingCart } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { toast } from 'sonner'
import type { CommunityGetBySlugResult } from '@tokengator/sdk'
import { WalletDropdown } from '@tokengator/wallet-ui'

import { SolanaProvider } from '@/lib/solana-provider'
import { Route as RootRoute } from '@/routes/__root'

import { Button } from '@tokengator/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@tokengator/ui/components/dialog'

import { useCommunityAssetMarketplaceAccessRefresh } from '../data-access/use-community-asset-marketplace-access-refresh'
import { useCommunityAssetMarketplaceBuyPrepare } from '../data-access/use-community-asset-marketplace-buy-prepare'
import { useCommunityAssetMarketplaceListingsQuery } from '../data-access/use-community-asset-marketplace-listings-query'

type CommunityAssetMarketplaceListing = {
  assetAddress: string
  auctionHouseAddress: string | null
  id: string
  imageUrl: string | null
  name: string | null
  priceSol: number
  seller: string
  sellerExpiry: number
  tokenAta: string
  verification: string
}
type CommunityAssetMarketplaceAssetGroup = CommunityGetBySlugResult['roles'][number]['assetGroups'][number]
type CommunityMarketplaceAvailability = CommunityGetBySlugResult['marketplace']
type CommunityRoleAssetMarketplaceAvailability = CommunityGetBySlugResult['roles'][number]['assetMarketplace']

function decodeBase64Transaction(data: string) {
  const binary = atob(data)
  const bytes = new Uint8Array(binary.length)

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index)
  }

  return bytes
}

function formatPriceSol(priceSol: number) {
  return new Intl.NumberFormat('en-US', {
    maximumFractionDigits: 4,
    minimumFractionDigits: 0,
  }).format(priceSol)
}

function getListingLabel(listing: CommunityAssetMarketplaceListing) {
  return listing.name ?? 'NFT listing'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function readPurchaseErrorMessage(value: unknown, depth = 0): string | null {
  if (value instanceof Error && value.message.trim()) {
    return value.message
  }

  if (typeof value === 'string' && value.trim()) {
    return value
  }

  if (!isRecord(value) || depth > 2) {
    return null
  }

  for (const key of ['message', 'reason', 'description']) {
    const message = readPurchaseErrorMessage(value[key], depth + 1)

    if (message) {
      return message
    }
  }

  for (const key of ['cause', 'error']) {
    const message = readPurchaseErrorMessage(value[key], depth + 1)

    if (message) {
      return message
    }
  }

  return null
}

function getPurchaseErrorMessage(error: unknown) {
  return readPurchaseErrorMessage(error) ?? 'The purchase could not be completed. Check your wallet and try again.'
}

function CommunityFeatureAssetMarketplaceConnected({
  account,
  assetGroup,
  isLinkedWallet,
  listing,
  slug,
}: {
  account: UiWalletAccount
  assetGroup: CommunityAssetMarketplaceAssetGroup
  isLinkedWallet: boolean
  listing: CommunityAssetMarketplaceListing | null
  slug: string
}) {
  const { appConfig } = RootRoute.useRouteContext()
  const chain = `solana:${appConfig.solanaCluster}` as `solana:${string}`
  const prepareBuy = useCommunityAssetMarketplaceBuyPrepare()
  const refreshAccess = useCommunityAssetMarketplaceAccessRefresh()
  const signAndSendTransaction = useSignAndSendTransaction(account, chain)
  const [isSending, setIsSending] = useState(false)
  const isPending = isSending || prepareBuy.isPending || refreshAccess.isPending

  async function buyListing() {
    if (!listing) {
      return
    }

    setIsSending(true)

    try {
      const prepared = await prepareBuy.mutateAsync({
        assetGroupId: assetGroup.id,
        buyer: account.address,
        listing,
        slug,
      })
      const { signature } = await signAndSendTransaction({
        transaction: decodeBase64Transaction(prepared.transaction.data),
      })
      const result = await refreshAccess.mutateAsync({
        assetGroupId: assetGroup.id,
        signature: getBase58Decoder().decode(signature),
        slug,
      })
      const blockingRefreshStep = [result.indexing, result.membershipSync].find(
        (step) => step.status === 'failed' || step.status === 'locked',
      )

      if (blockingRefreshStep) {
        toast.error('Purchase submitted, but access refresh did not complete', {
          description: blockingRefreshStep.message ?? 'Please retry the refresh in a moment.',
        })
        return
      }

      toast.success('Purchase submitted', {
        description:
          result.membershipSync.status === 'succeeded'
            ? 'Community access was refreshed.'
            : 'Access refresh is still pending.',
      })
    } catch (error) {
      toast.error('Purchase failed', {
        description: getPurchaseErrorMessage(error),
      })
    } finally {
      setIsSending(false)
    }
  }

  return (
    <Button
      className="w-full gap-2"
      disabled={!isLinkedWallet || !listing || isPending}
      onClick={() => void buyListing()}
    >
      {isPending ? <Loader2 className="size-4 animate-spin" /> : <ShoppingCart className="size-4" />}
      {isPending ? 'Buying...' : 'Buy NFT'}
    </Button>
  )
}

function CommunityFeatureAssetMarketplaceGrid({
  listings,
  onListingSelect,
}: {
  listings: CommunityAssetMarketplaceListing[]
  onListingSelect: (listingId: string) => void
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {listings.map((listing) => (
        <button
          aria-label={`View ${getListingLabel(listing)}`}
          className="hover:bg-muted/60 focus-visible:ring-ring grid min-w-0 gap-2 rounded-md border p-2 text-left transition-colors focus-visible:ring-2 focus-visible:outline-none"
          key={listing.id}
          onClick={() => onListingSelect(listing.id)}
          type="button"
        >
          {listing.imageUrl ? (
            <img
              alt={getListingLabel(listing)}
              className="bg-muted aspect-square w-full rounded-md border object-cover"
              loading="lazy"
              src={listing.imageUrl}
            />
          ) : (
            <span className="bg-muted aspect-square w-full rounded-md border" />
          )}
          <span className="grid min-w-0 gap-1 px-1 pb-1">
            <span className="truncate font-medium">{getListingLabel(listing)}</span>
            <span className="text-muted-foreground text-xs font-medium">{formatPriceSol(listing.priceSol)} SOL</span>
          </span>
        </button>
      ))}
    </div>
  )
}

function CommunityFeatureAssetMarketplaceListingDetail({
  buyAction,
  listing,
  onBack,
  walletAction,
}: {
  buyAction: ReactNode
  listing: CommunityAssetMarketplaceListing
  onBack: () => void
  walletAction: ReactNode
}) {
  return (
    <div className="grid gap-4">
      <Button className="w-fit gap-2" onClick={onBack} size="sm" variant="ghost">
        <ArrowLeft className="size-4" />
        Listings
      </Button>

      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(240px,320px)]">
        {listing.imageUrl ? (
          <img
            alt={getListingLabel(listing)}
            className="bg-muted aspect-square w-full rounded-md border object-cover"
            loading="lazy"
            src={listing.imageUrl}
          />
        ) : (
          <span className="bg-muted aspect-square w-full rounded-md border" />
        )}

        <div className="grid content-start gap-4">
          <div className="grid gap-1">
            <h3 className="text-xl font-semibold">{getListingLabel(listing)}</h3>
            <p className="text-muted-foreground text-sm">Magic Eden listing</p>
          </div>

          <div className="rounded-md border p-3">
            <p className="text-muted-foreground text-xs">Price</p>
            <p className="text-2xl font-semibold">{formatPriceSol(listing.priceSol)} SOL</p>
          </div>

          {walletAction}
          {buyAction}
        </div>
      </div>
    </div>
  )
}

function CommunityFeatureAssetMarketplaceDialog({
  assetGroup,
  assetMarketplace,
  onOpenChange,
  open,
  slug,
}: {
  assetGroup: CommunityAssetMarketplaceAssetGroup
  assetMarketplace: CommunityRoleAssetMarketplaceAvailability
  onOpenChange: (open: boolean) => void
  open: boolean
  slug: string
}) {
  const { account } = useWalletUi()
  const { appAuthState } = RootRoute.useRouteContext()
  const [previewListingId, setPreviewListingId] = useState<string | null>(null)
  const linkedWalletAddresses = useMemo(
    () => new Set(appAuthState.solanaWallets?.solanaWallets.map((wallet) => wallet.address) ?? []),
    [appAuthState.solanaWallets],
  )
  const isLinkedWallet = Boolean(account && linkedWalletAddresses.has(account.address))
  const listings = useCommunityAssetMarketplaceListingsQuery({
    assetGroupId: assetGroup.id,
    enabled: open && assetMarketplace.enabled,
    limit: 100,
    slug,
  })
  const previewListing = listings.data?.listings.find((listing) => listing.id === previewListingId) ?? null
  const canSignAndSend = Boolean(account?.features.includes('solana:signAndSendTransaction'))
  const buyAction =
    account && canSignAndSend ? (
      <CommunityFeatureAssetMarketplaceConnected
        account={account}
        assetGroup={assetGroup}
        isLinkedWallet={isLinkedWallet}
        listing={previewListing}
        slug={slug}
      />
    ) : (
      <Button className="w-full gap-2" disabled>
        <ShoppingCart className="size-4" />
        Buy NFT
      </Button>
    )
  const walletAction = (
    <div className="grid gap-2">
      <WalletDropdown className="w-full" />
      {account && !canSignAndSend ? (
        <p className="text-muted-foreground text-sm">This wallet cannot send Solana transactions.</p>
      ) : null}
      {account && !isLinkedWallet ? (
        <p className="text-muted-foreground text-sm">This wallet is not linked to your profile.</p>
      ) : null}
      {!account ? <p className="text-muted-foreground text-sm">Connect a linked wallet to continue.</p> : null}
    </div>
  )

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogTrigger render={<Button className="w-full gap-2" size="sm" variant="outline" />}>
        <ShoppingCart className="size-4" />
        Buy NFT
      </DialogTrigger>
      <DialogContent className="grid h-[calc(100vh-2rem)] max-h-[840px] grid-rows-[auto_minmax(0,1fr)] overflow-hidden sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>Buy {assetGroup.label}</DialogTitle>
          <DialogDescription>{assetGroup.label} listings on Magic Eden.</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 overflow-y-auto pr-1">
          {previewListing ? (
            <CommunityFeatureAssetMarketplaceListingDetail
              buyAction={buyAction}
              listing={previewListing}
              onBack={() => setPreviewListingId(null)}
              walletAction={walletAction}
            />
          ) : (
            <div className="grid gap-3">
              {listings.isPending ? <p className="text-muted-foreground text-sm">Loading listings...</p> : null}
              {listings.isError ? (
                <p className="text-destructive text-sm">
                  {listings.error instanceof Error ? listings.error.message : 'Unable to load listings.'}
                </p>
              ) : null}
              {listings.data?.listings.length === 0 ? (
                <p className="text-muted-foreground text-sm">No listings available.</p>
              ) : null}
              {listings.data?.listings.length ? (
                <CommunityFeatureAssetMarketplaceGrid
                  listings={listings.data.listings}
                  onListingSelect={setPreviewListingId}
                />
              ) : null}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function CommunityFeatureAssetMarketplace({
  assetGroup,
  assetMarketplace,
  marketplace,
  slug,
}: {
  assetGroup: CommunityAssetMarketplaceAssetGroup
  assetMarketplace: CommunityRoleAssetMarketplaceAvailability | null
  marketplace: CommunityMarketplaceAvailability
  slug: string
}) {
  const [open, setOpen] = useState(false)

  if (
    assetGroup.type !== 'collection' ||
    !assetGroup.symbolMagicEden ||
    !assetMarketplace?.enabled ||
    assetMarketplace.assetGroupId !== assetGroup.id ||
    !marketplace.magicEden.enabled
  ) {
    return null
  }

  return (
    <SolanaProvider>
      <CommunityFeatureAssetMarketplaceDialog
        assetGroup={assetGroup}
        assetMarketplace={assetMarketplace}
        onOpenChange={setOpen}
        open={open}
        slug={slug}
      />
    </SolanaProvider>
  )
}

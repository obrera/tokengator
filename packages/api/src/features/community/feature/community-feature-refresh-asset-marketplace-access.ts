import { ORPCError } from '@orpc/server'
import { env } from '@tokengator/env/api'

import { AssetGroupIndexConfigError, indexAssetGroup } from '../../../features/asset-group-index'
import { applyCommunityRoleDiscordSync, applyCommunityRoleSync } from '../../../features/community-role-sync'
import { AutomationLockConflictError } from '../../../lib/automation-lock'
import { protectedProcedure } from '../../../lib/procedures'
import { communityRefreshAssetMarketplaceAccessInputSchema } from '../data-access/community-asset-marketplace-input-schemas'
import { communityGetMarketplaceCollectionForUser } from '../data-access/community-asset-marketplace-lookup'
import { communityGetBySlugForUser } from '../data-access/community-get-by-slug-for-user'
import { getMagicEdenConfig } from '../data-access/community-marketplace'

type RefreshStepStatus = 'failed' | 'locked' | 'skipped' | 'succeeded'

type SolanaRpcResponse<T> = {
  error?: {
    message?: string
  }
  result?: T
}

type SolanaSignatureStatus = {
  confirmationStatus?: 'confirmed' | 'finalized' | 'processed' | null
  err?: unknown
}

type SolanaSignatureStatusesResult = {
  value?: Array<SolanaSignatureStatus | null>
}

function createRefreshStep(status: RefreshStepStatus, message: string | null = null) {
  return {
    message,
    status,
  }
}

function isLikelySolanaSignature(signature: string) {
  return signature.length >= 64 && signature.length <= 88 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(signature)
}

async function requireConfirmedSolanaSignature(input: { signal?: AbortSignal; signature: string }) {
  const signature = input.signature.trim()

  if (!isLikelySolanaSignature(signature)) {
    throw new ORPCError('BAD_REQUEST', {
      message: 'Purchase transaction signature is invalid.',
    })
  }

  const response = await fetch(env.SOLANA_ENDPOINT_PUBLIC, {
    body: JSON.stringify({
      id: 'tokengator-asset-marketplace-refresh',
      jsonrpc: '2.0',
      method: 'getSignatureStatuses',
      params: [
        [signature],
        {
          searchTransactionHistory: true,
        },
      ],
    }),
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'POST',
    signal: input.signal,
  })
  const payload = (await response.json().catch(() => null)) as SolanaRpcResponse<SolanaSignatureStatusesResult> | null

  if (!response.ok || !payload || typeof payload !== 'object' || Array.isArray(payload)) {
    throw new ORPCError('INTERNAL_SERVER_ERROR', {
      message: payload?.error?.message ?? `Solana signature lookup failed with status ${response.status}.`,
    })
  }

  if (payload.error) {
    throw new ORPCError('BAD_REQUEST', {
      message: payload.error.message ?? 'Purchase transaction signature is invalid.',
    })
  }

  const status = payload.result?.value?.[0] ?? null

  if (!status) {
    throw new ORPCError('BAD_REQUEST', {
      message: 'Purchase transaction signature was not found.',
    })
  }

  if (status.err) {
    throw new ORPCError('BAD_REQUEST', {
      message: 'Purchase transaction failed.',
    })
  }

  if (status.confirmationStatus !== 'confirmed' && status.confirmationStatus !== 'finalized') {
    throw new ORPCError('BAD_REQUEST', {
      message: 'Purchase transaction is not confirmed yet.',
    })
  }
}

export const communityFeatureRefreshAssetMarketplaceAccess = protectedProcedure
  .input(communityRefreshAssetMarketplaceAccessInputSchema)
  .handler(async ({ context, input }) => {
    const magicEdenConfig = getMagicEdenConfig()

    if (!magicEdenConfig) {
      throw new ORPCError('BAD_REQUEST', {
        message: 'Magic Eden purchases are not configured.',
      })
    }

    await requireConfirmedSolanaSignature({
      signal: context.requestSignal,
      signature: input.signature,
    })

    const collectionLookup = await communityGetMarketplaceCollectionForUser({
      assetGroupId: input.assetGroupId,
      slug: input.slug,
      userId: context.session.user.id,
    })

    if (collectionLookup.status === 'collection-not-found' || collectionLookup.status === 'community-not-found') {
      throw new ORPCError('NOT_FOUND', {
        message: collectionLookup.message,
      })
    }

    if (collectionLookup.status !== 'ok') {
      throw new ORPCError('BAD_REQUEST', {
        message: collectionLookup.message,
      })
    }

    let indexing = createRefreshStep('skipped')
    let membershipSync = createRefreshStep('skipped')
    let discordSync = createRefreshStep('skipped')

    try {
      await indexAssetGroup({
        apiKey: env.HELIUS_API_KEY,
        assetGroup: {
          address: collectionLookup.assetGroup.address,
          id: collectionLookup.assetGroup.id,
          resolverKind: collectionLookup.assetGroup.resolverKind,
          type: collectionLookup.assetGroup.type,
        },
        heliusCluster: env.HELIUS_CLUSTER,
        signal: context.requestSignal,
      })
      indexing = createRefreshStep('succeeded')
    } catch (error) {
      if (error instanceof AutomationLockConflictError) {
        indexing = createRefreshStep('locked', 'Asset indexing is already running for this collection.')
      } else if (error instanceof AssetGroupIndexConfigError) {
        indexing = createRefreshStep('failed', error.message)
      } else {
        indexing = createRefreshStep('failed', error instanceof Error ? error.message : 'Asset indexing failed.')
      }
    }

    if (indexing.status === 'succeeded') {
      try {
        await applyCommunityRoleSync(collectionLookup.community.id)
        membershipSync = createRefreshStep('succeeded')
      } catch (error) {
        if (error instanceof AutomationLockConflictError) {
          membershipSync = createRefreshStep('locked', 'Community membership sync is already running.')
        } else {
          membershipSync = createRefreshStep(
            'failed',
            error instanceof Error ? error.message : 'Community membership sync failed.',
          )
        }
      }
    }

    if (membershipSync.status === 'succeeded') {
      try {
        await applyCommunityRoleDiscordSync(collectionLookup.community.id)
        discordSync = createRefreshStep('succeeded')
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Community Discord sync failed.'

        discordSync =
          message === 'Discord role sync is disabled for this community.'
            ? createRefreshStep('skipped', message)
            : createRefreshStep('failed', message)
      }
    }

    const community = await communityGetBySlugForUser({
      slug: input.slug,
      userId: context.session.user.id,
    })

    if (!community) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Community not found.',
      })
    }

    return {
      community,
      discordSync,
      indexing,
      membershipSync,
    }
  })

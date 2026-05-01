import { ORPCError } from '@orpc/server'

import { adminProcedure } from '../../../lib/procedures'
import { adminUserLinkSolanaWallet as adminUserLinkSolanaWalletDataAccess } from '../data-access/admin-user-link-solana-wallet'
import { adminUserLinkSolanaWalletInputSchema } from '../data-access/admin-user-link-solana-wallet-input-schema'

export const adminUserFeatureLinkSolanaWallet = adminProcedure
  .input(adminUserLinkSolanaWalletInputSchema)
  .handler(async ({ input }) => {
    const result = await adminUserLinkSolanaWalletDataAccess(input)

    if (result.status === 'user-not-found') {
      throw new ORPCError('NOT_FOUND', {
        message: 'User not found.',
      })
    }

    if (result.status === 'solana-wallet-linked-to-another-user') {
      throw new ORPCError('BAD_REQUEST', {
        message: 'Solana wallet is already linked to another user.',
      })
    }

    if (result.status === 'user-updated-but-not-loaded') {
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'User was updated but could not be loaded.',
      })
    }

    return result.user
  })

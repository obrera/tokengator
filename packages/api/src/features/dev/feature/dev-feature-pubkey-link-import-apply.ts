import { ORPCError } from '@orpc/server'

import { adminProcedure } from '../../../lib/procedures'
import {
  devPubkeyLinkImportApply as devPubkeyLinkImportApplyDataAccess,
  DevPubkeyLinkImportError,
} from '../data-access/dev-pubkey-link-import'
import { devPubkeyLinkImportInputSchema } from '../data-access/dev-pubkey-link-import-input-schema'

export const devFeaturePubkeyLinkImportApply = adminProcedure
  .input(devPubkeyLinkImportInputSchema)
  .handler(async ({ input }) => {
    try {
      return await devPubkeyLinkImportApplyDataAccess(input)
    } catch (error) {
      if (error instanceof DevPubkeyLinkImportError) {
        throw new ORPCError('BAD_REQUEST', {
          message: error.message,
        })
      }

      throw error
    }
  })

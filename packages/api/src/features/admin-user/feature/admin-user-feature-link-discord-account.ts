import { ORPCError } from '@orpc/server'

import { adminProcedure } from '../../../lib/procedures'
import { adminUserLinkDiscordAccount as adminUserLinkDiscordAccountDataAccess } from '../data-access/admin-user-link-discord-account'
import { adminUserLinkDiscordAccountInputSchema } from '../data-access/admin-user-link-discord-account-input-schema'

export const adminUserFeatureLinkDiscordAccount = adminProcedure
  .input(adminUserLinkDiscordAccountInputSchema)
  .handler(async ({ input }) => {
    const result = await adminUserLinkDiscordAccountDataAccess(input)

    if (result.status === 'discord-account-id-required') {
      throw new ORPCError('BAD_REQUEST', {
        message: 'Discord account ID is required.',
      })
    }

    if (result.status === 'user-not-found') {
      throw new ORPCError('NOT_FOUND', {
        message: 'User not found.',
      })
    }

    if (result.status === 'discord-account-linked-to-another-user') {
      throw new ORPCError('BAD_REQUEST', {
        message: 'Discord account is already linked to another user.',
      })
    }

    if (result.status === 'user-updated-but-not-loaded') {
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'User was updated but could not be loaded.',
      })
    }

    return result.user
  })

import { ORPCError } from '@orpc/server'

import { protectedProcedure } from '../../../lib/procedures'

import { profileApiKeyRevoke as profileApiKeyRevokeDataAccess } from '../data-access/profile-api-key-revoke'
import { profileApiKeyRevokeInputSchema } from '../data-access/profile-api-key-revoke-input-schema'

function getErrorStatus(error: unknown) {
  if (!error || typeof error !== 'object') {
    return undefined
  }

  const record = error as Record<string, unknown>

  if (typeof record.statusCode === 'number') {
    return record.statusCode
  }

  if (typeof record.status === 'number') {
    return record.status
  }

  if (record.status === 'NOT_FOUND') {
    return 404
  }

  return undefined
}

export const profileFeatureRevokeApiKey = protectedProcedure
  .input(profileApiKeyRevokeInputSchema)
  .handler(async ({ context, input }) => {
    try {
      return await profileApiKeyRevokeDataAccess({
        apiKey: input,
        requestHeaders: context.requestHeaders,
      })
    } catch (error) {
      if (getErrorStatus(error) === 404) {
        throw new ORPCError('NOT_FOUND', {
          message: 'API key not found.',
        })
      }

      throw error
    }
  })

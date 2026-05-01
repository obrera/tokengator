import { ORPCError } from '@orpc/server'

import { adminProcedure } from '../../../lib/procedures'
import { adminUserCreate as adminUserCreateDataAccess } from '../data-access/admin-user-create'
import { adminUserCreateInputSchema } from '../data-access/admin-user-create-input-schema'

export const adminUserFeatureCreate = adminProcedure.input(adminUserCreateInputSchema).handler(async ({ input }) => {
  const result = await adminUserCreateDataAccess(input)

  if (result.status === 'user-email-taken') {
    throw new ORPCError('BAD_REQUEST', {
      message: 'User email is already taken.',
    })
  }

  if (result.status === 'user-username-taken') {
    throw new ORPCError('BAD_REQUEST', {
      message: 'Username is already taken.',
    })
  }

  if (result.status === 'user-created-but-not-loaded') {
    throw new ORPCError('INTERNAL_SERVER_ERROR', {
      message: 'User was created but could not be loaded.',
    })
  }

  return result.user
})

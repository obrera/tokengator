import { ORPCError } from '@orpc/server'

import { adminProcedure } from '../../../lib/procedures'

import { adminOrganizationAddMember as adminOrganizationAddMemberDataAccess } from '../data-access/admin-organization-add-member'
import { adminOrganizationAddMemberInputSchema } from '../data-access/admin-organization-add-member-input-schema'

export const adminOrganizationFeatureAddMember = adminProcedure
  .input(adminOrganizationAddMemberInputSchema)
  .handler(async ({ input }) => {
    const result = await adminOrganizationAddMemberDataAccess(input)

    if (result.status === 'organization-not-found') {
      throw new ORPCError('NOT_FOUND', {
        message: 'Organization not found.',
      })
    }

    if (result.status === 'user-not-found') {
      throw new ORPCError('NOT_FOUND', {
        message: 'User not found.',
      })
    }

    return {
      memberId: result.memberId,
      organizationId: result.organizationId,
      role: result.role,
      userId: result.userId,
    }
  })

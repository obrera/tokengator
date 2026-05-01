import z from 'zod'

import { adminOrganizationMemberRoleSchema } from './admin-organization-member-role'

export const adminOrganizationAddMemberInputSchema = z.object({
  organizationId: z.string().min(1),
  role: adminOrganizationMemberRoleSchema,
  userId: z.string().min(1),
})

import z from 'zod'

import { adminOrganizationAddMemberInputSchema } from './admin-organization-add-member-input-schema'

export type AdminOrganizationAddMemberInput = z.infer<typeof adminOrganizationAddMemberInputSchema>

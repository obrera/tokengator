import type z from 'zod'

import type { adminCommunityRoleCreateDiscordRoleMappingInputSchema } from './admin-community-role-create-discord-role-mapping-input-schema'

export type AdminCommunityRoleCreateDiscordRoleMappingInput = z.infer<
  typeof adminCommunityRoleCreateDiscordRoleMappingInputSchema
>

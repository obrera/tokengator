import z from 'zod'

export const adminCommunityRoleCreateDiscordRoleMappingInputSchema = z.object({
  communityRoleId: z.string().min(1),
})

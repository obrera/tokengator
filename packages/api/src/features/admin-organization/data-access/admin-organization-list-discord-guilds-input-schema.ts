import z from 'zod'

export const adminOrganizationListDiscordGuildsInputSchema = z.object({
  organizationId: z.string().min(1),
})

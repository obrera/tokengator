import z from 'zod'

export const adminUserLinkDiscordAccountInputSchema = z.object({
  accountId: z.string().trim().min(1),
  userId: z.string().min(1),
})

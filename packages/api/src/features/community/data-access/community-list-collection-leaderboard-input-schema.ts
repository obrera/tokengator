import z from 'zod'

export const communityListCollectionLeaderboardInputSchema = z.object({
  address: z.string().trim().min(1),
  limit: z.number().int().max(1000).min(1).optional(),
  slug: z.string().trim().min(1),
})

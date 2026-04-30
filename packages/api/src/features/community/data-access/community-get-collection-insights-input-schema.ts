import z from 'zod'

export const communityGetCollectionInsightsInputSchema = z.object({
  address: z.string().trim().min(1),
  slug: z.string().trim().min(1),
})

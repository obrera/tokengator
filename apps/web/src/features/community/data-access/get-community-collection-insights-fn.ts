import { createServerFn } from '@tanstack/react-start'
import z from 'zod'
import type { CommunityGetCollectionInsightsResult } from '@tokengator/sdk'

import { authMiddleware } from '@/features/auth/data-access/auth-middleware'
import { serverOrpcClient } from '@/lib/orpc-server'

const communityCollectionInsightsInputSchema = z.object({
  address: z.string().trim().min(1),
  slug: z.string().trim().min(1),
})

export const getCommunityCollectionInsights = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator((input: { address: string; slug: string }) => communityCollectionInsightsInputSchema.parse(input))
  .handler(async ({ data }) => {
    return (await serverOrpcClient.community.getCollectionInsights({
      address: data.address,
      slug: data.slug,
    })) satisfies CommunityGetCollectionInsightsResult
  })

import { createServerFn } from '@tanstack/react-start'
import z from 'zod'
import type { CommunityListCollectionLeaderboardResult } from '@tokengator/sdk'

import { authMiddleware } from '@/features/auth/data-access/auth-middleware'
import { serverOrpcClient } from '@/lib/orpc-server'

const communityCollectionLeaderboardInputSchema = z.object({
  address: z.string().trim().min(1),
  holderFilter: z.enum(['known', 'unknown']).optional(),
  limit: z.number().int().max(1000).min(1).optional(),
  slug: z.string().trim().min(1),
})

export const getCommunityCollectionLeaderboard = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator((input: { address: string; holderFilter?: 'known' | 'unknown'; limit?: number; slug: string }) =>
    communityCollectionLeaderboardInputSchema.parse(input),
  )
  .handler(async ({ data }) => {
    return (await serverOrpcClient.community.listCollectionLeaderboard({
      address: data.address,
      holderFilter: data.holderFilter,
      limit: data.limit,
      slug: data.slug,
    })) satisfies CommunityListCollectionLeaderboardResult
  })

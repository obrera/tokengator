import { ORPCError } from '@orpc/server'

import { protectedProcedure } from '../../../lib/procedures'

import { communityListCollectionLeaderboard as communityListCollectionLeaderboardDataAccess } from '../data-access/community-list-collection-leaderboard'
import { communityListCollectionLeaderboardInputSchema } from '../data-access/community-list-collection-leaderboard-input-schema'

export const communityFeatureListCollectionLeaderboard = protectedProcedure
  .input(communityListCollectionLeaderboardInputSchema)
  .handler(async ({ input }) => {
    const leaderboard = await communityListCollectionLeaderboardDataAccess(input)

    if (!leaderboard) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Collection not found.',
      })
    }

    return leaderboard
  })

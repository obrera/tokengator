import { ORPCError } from '@orpc/server'

import { protectedProcedure } from '../../../lib/procedures'

import { communityGetCollectionInsights as communityGetCollectionInsightsDataAccess } from '../data-access/community-get-collection-insights'
import { communityGetCollectionInsightsInputSchema } from '../data-access/community-get-collection-insights-input-schema'

export const communityFeatureGetCollectionInsights = protectedProcedure
  .input(communityGetCollectionInsightsInputSchema)
  .handler(async ({ input }) => {
    const insights = await communityGetCollectionInsightsDataAccess(input)

    if (!insights) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Collection not found.',
      })
    }

    return insights
  })

import { ORPCError } from '@orpc/server'

import { protectedProcedure } from '../../../lib/procedures'
import { communityGetBySlugForUser as communityGetBySlugForUserDataAccess } from '../data-access/community-get-by-slug-for-user'
import { communitySlugInputSchema } from '../data-access/community-slug-input-schema'

export const communityFeatureGetBySlug = protectedProcedure
  .input(communitySlugInputSchema)
  .handler(async ({ context, input }) => {
    const community = await communityGetBySlugForUserDataAccess({
      slug: input.slug,
      userId: context.session.user.id,
    })

    if (!community) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Community not found.',
      })
    }

    return community
  })

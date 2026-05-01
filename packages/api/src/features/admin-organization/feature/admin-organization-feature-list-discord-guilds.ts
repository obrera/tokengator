import { ORPCError } from '@orpc/server'
import z from 'zod'

import { adminProcedure } from '../../../lib/procedures'
import { adminOrganizationListDiscordGuilds as adminOrganizationListDiscordGuildsDataAccess } from '../data-access/admin-organization-list-discord-guilds'
import { adminOrganizationListDiscordGuildsInputSchema } from '../data-access/admin-organization-list-discord-guilds-input-schema'

const adminOrganizationDiscordGuildOutputSchema = z.object({
  assignedCommunity: z
    .object({
      id: z.string(),
      name: z.string(),
      slug: z.string(),
    })
    .nullable(),
  disabled: z.boolean(),
  id: z.string(),
  name: z.string(),
})

export const adminOrganizationFeatureListDiscordGuilds = adminProcedure
  .input(adminOrganizationListDiscordGuildsInputSchema)
  .output(z.array(adminOrganizationDiscordGuildOutputSchema))
  .handler(async ({ input }) => {
    const result = await adminOrganizationListDiscordGuildsDataAccess(input)

    if (!result) {
      throw new ORPCError('NOT_FOUND', {
        message: 'Organization not found.',
      })
    }

    return result
  })

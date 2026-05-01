import { ORPCError } from '@orpc/server'
import z from 'zod'

import { adminProcedure } from '../../../lib/procedures'
import { adminCommunityRoleCreateDiscordRoleMapping as adminCommunityRoleCreateDiscordRoleMappingDataAccess } from '../data-access/admin-community-role-create-discord-role-mapping'
import { adminCommunityRoleCreateDiscordRoleMappingInputSchema } from '../data-access/admin-community-role-create-discord-role-mapping-input-schema'
import { adminCommunityRoleDiscordGuildRoleInspectionCheckMessages } from '../util/admin-community-role-discord-mapping-status'

const adminCommunityRoleCreateDiscordRoleMappingOutputSchema = z.object({
  created: z.boolean(),
  discordRoleId: z.string(),
  discordRoleName: z.string(),
  mapping: z.object({
    checks: z.array(z.string()),
    status: z.enum(['needs_attention', 'not_mapped', 'ready']),
  }),
})

export const adminCommunityRoleFeatureCreateDiscordRoleMapping = adminProcedure
  .input(adminCommunityRoleCreateDiscordRoleMappingInputSchema)
  .output(adminCommunityRoleCreateDiscordRoleMappingOutputSchema)
  .handler(async ({ input }) => {
    const result = await adminCommunityRoleCreateDiscordRoleMappingDataAccess(input)

    if (result.status === 'community-role-not-found') {
      throw new ORPCError('NOT_FOUND', {
        message: 'Community role not found.',
      })
    }

    if (result.status === 'community-role-updated-but-not-loaded') {
      throw new ORPCError('INTERNAL_SERVER_ERROR', {
        message: 'Community role was updated but could not be loaded.',
      })
    }

    if (result.status === 'discord-connection-not-found') {
      throw new ORPCError('BAD_REQUEST', {
        message: 'Connect a Discord server for this community before mapping roles.',
      })
    }

    if (result.status === 'discord-role-already-mapped') {
      throw new ORPCError('BAD_REQUEST', {
        message: `Discord role is already mapped to ${result.communityRoleName}.`,
      })
    }

    if (result.status === 'discord-connection-blocked') {
      throw new ORPCError('BAD_REQUEST', {
        message: adminCommunityRoleDiscordGuildRoleInspectionCheckMessages[result.check],
      })
    }

    if (result.status === 'discord-role-not-found') {
      throw new ORPCError('BAD_REQUEST', {
        message: 'Selected Discord role was not found in the connected server.',
      })
    }

    if (result.status === 'discord-role-default') {
      throw new ORPCError('BAD_REQUEST', {
        message: 'The @everyone Discord role cannot be mapped.',
      })
    }

    if (result.status === 'discord-role-managed') {
      throw new ORPCError('BAD_REQUEST', {
        message: 'Managed Discord roles cannot be mapped.',
      })
    }

    return {
      created: result.created,
      discordRoleId: result.discordRoleId,
      discordRoleName: result.discordRoleName,
      mapping: result.mapping,
    }
  })

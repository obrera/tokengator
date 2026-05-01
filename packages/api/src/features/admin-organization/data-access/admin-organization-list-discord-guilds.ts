import { eq } from 'drizzle-orm'
import { db } from '@tokengator/db'
import { organization } from '@tokengator/db/schema/auth'
import { communityDiscordConnection } from '@tokengator/db/schema/community-role'
import { listDiscordGuilds } from '@tokengator/discord/list-discord-guilds'
import { env } from '@tokengator/env/api'

import type { AdminOrganizationListDiscordGuildsInput } from './admin-organization-list-discord-guilds-input'
import { adminOrganizationRecordGet } from './admin-organization-record-get'
import { toAdminOrganizationDiscordGuildEntity } from './admin-organization.entity'

export interface AdminOrganizationListDiscordGuildsOptions {
  listGuilds?: typeof listDiscordGuilds
}

async function listAssignedDiscordGuilds() {
  return await db
    .select({
      guildId: communityDiscordConnection.guildId,
      organizationId: organization.id,
      organizationName: organization.name,
      organizationSlug: organization.slug,
    })
    .from(communityDiscordConnection)
    .innerJoin(organization, eq(communityDiscordConnection.organizationId, organization.id))
}

export async function adminOrganizationListDiscordGuilds(
  input: AdminOrganizationListDiscordGuildsInput,
  options: AdminOrganizationListDiscordGuildsOptions = {},
) {
  const existingOrganization = await adminOrganizationRecordGet(input.organizationId)

  if (!existingOrganization) {
    return null
  }

  const listGuilds = options.listGuilds ?? listDiscordGuilds
  const [assignedGuilds, discordGuilds] = await Promise.all([
    listAssignedDiscordGuilds(),
    listGuilds({
      env,
    }),
  ])
  const assignedGuildsByGuildId = new Map(assignedGuilds.map((guild) => [guild.guildId, guild] as const))

  return discordGuilds
    .map((guild) => {
      const assignedGuild = assignedGuildsByGuildId.get(guild.id) ?? null

      return toAdminOrganizationDiscordGuildEntity({
        assignedCommunity: assignedGuild
          ? {
              id: assignedGuild.organizationId,
              name: assignedGuild.organizationName,
              slug: assignedGuild.organizationSlug,
            }
          : null,
        disabled: Boolean(assignedGuild),
        id: guild.id,
        name: guild.name,
      })
    })
    .sort((left, right) => left.name.localeCompare(right.name) || left.id.localeCompare(right.id))
}

import { ensureDiscordRole } from '@tokengator/discord/ensure-discord-role'
import { env } from '@tokengator/env/api'

import { adminCommunityRoleBlockingDiscordGuildRoleChecks } from '../util/admin-community-role-discord-mapping-status'

import type { AdminCommunityRoleCreateDiscordRoleMappingInput } from './admin-community-role-create-discord-role-mapping-input'
import { adminCommunityRoleDiscordGuildRolesGet } from './admin-community-role-discord-guild-roles-get'
import { adminCommunityRoleEntityGet } from './admin-community-role-entity-get'
import { adminCommunityRoleSetDiscordRoleMapping } from './admin-community-role-set-discord-role-mapping'

function normalizeDiscordRoleName(name: string) {
  return name.replaceAll(/\s+/g, ' ').trim().toLowerCase()
}

export async function adminCommunityRoleCreateDiscordRoleMapping(
  input: AdminCommunityRoleCreateDiscordRoleMappingInput,
) {
  const existingCommunityRole = await adminCommunityRoleEntityGet(input.communityRoleId)

  if (!existingCommunityRole) {
    return {
      status: 'community-role-not-found' as const,
    }
  }

  const guildRolesResult = await adminCommunityRoleDiscordGuildRolesGet(existingCommunityRole.organizationId)

  if (!guildRolesResult.connection) {
    return {
      status: 'discord-connection-not-found' as const,
    }
  }

  const discordConnection = guildRolesResult.connection
  const blockingCheck =
    discordConnection.diagnostics.checks.find((check) => adminCommunityRoleBlockingDiscordGuildRoleChecks.has(check)) ??
    null

  if (blockingCheck) {
    return {
      check: blockingCheck,
      status: 'discord-connection-blocked' as const,
    }
  }

  const normalizedCommunityRoleName = normalizeDiscordRoleName(existingCommunityRole.name)
  const matchingGuildRole =
    guildRolesResult.guildRoles.find(
      (guildRole) =>
        !guildRole.isDefault &&
        !guildRole.managed &&
        normalizeDiscordRoleName(guildRole.name) === normalizedCommunityRoleName,
    ) ?? null

  if (!matchingGuildRole && discordConnection.diagnostics.checks.includes('manage_roles_missing')) {
    return {
      check: 'manage_roles_missing' as const,
      status: 'discord-connection-blocked' as const,
    }
  }

  const discordRole = matchingGuildRole
    ? {
        created: false,
        roleId: matchingGuildRole.id,
        roleName: matchingGuildRole.name,
      }
    : await ensureDiscordRole(
        {
          env,
        },
        {
          canUseExistingRole: (role) => role.id !== discordConnection.guildId && !role.managed,
          guildId: discordConnection.guildId,
          name: existingCommunityRole.name,
        },
      )

  const mappingResult = await adminCommunityRoleSetDiscordRoleMapping({
    communityRoleId: input.communityRoleId,
    discordRoleId: discordRole.roleId,
  })

  if (mappingResult.status !== 'success') {
    return mappingResult
  }

  return {
    created: discordRole.created,
    discordRoleId: discordRole.roleId,
    discordRoleName: discordRole.roleName,
    mapping: mappingResult.mapping,
    status: 'success' as const,
  }
}

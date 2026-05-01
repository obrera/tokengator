import type { RESTGetAPIGuildRolesResult, RESTPostAPIGuildRoleJSONBody, RESTPostAPIGuildRoleResult } from 'discord.js'
import { REST, Routes } from 'discord.js'

import type { DiscordContext } from './discord-context'
import { getDiscordBotToken, getDiscordGuildId } from './discord-env'

export interface DiscordRoleRestClient {
  get(route: string): Promise<unknown>
  post(route: string, options: { body?: unknown }): Promise<unknown>
}

export type DiscordRoleRecord = RESTGetAPIGuildRolesResult[number]

export interface DiscordRoleProvisioningState {
  guildId: string
  rest: DiscordRoleRestClient
  roles?: DiscordRoleRecord[]
  rolesByName: Map<string, DiscordRoleRecord>
}

export interface EnsureDiscordRoleOptions {
  canUseExistingRole?: (role: DiscordRoleRecord) => boolean
  guildId?: string
  name: string
  state?: DiscordRoleProvisioningState
  token?: string
}

export interface EnsureDiscordRoleResult {
  created: boolean
  roleId: string
  roleName: string
}

export interface ListDiscordRolesOptions {
  guildId?: string
  rest?: DiscordRoleRestClient
  token?: string
}

function getDiscordRoleRestClient(
  ctx: Pick<DiscordContext, 'env'>,
  options: { rest?: DiscordRoleRestClient; token?: string },
): DiscordRoleRestClient {
  if (options.rest) {
    return options.rest
  }

  const token = getDiscordBotToken(ctx, options.token)

  return new REST({ version: '10' }).setToken(token)
}

function findDiscordRoleByName(input: {
  canUseExistingRole?: (role: DiscordRoleRecord) => boolean
  name: string
  roles: DiscordRoleRecord[]
}) {
  return input.roles.find((role) => role.name === input.name && (input.canUseExistingRole?.(role) ?? true))
}

export async function listDiscordRoles(
  ctx: Pick<DiscordContext, 'env'>,
  options: ListDiscordRolesOptions = {},
): Promise<DiscordRoleProvisioningState> {
  const guildId = getDiscordGuildId(ctx, options.guildId)
  const rest = getDiscordRoleRestClient(ctx, options)
  const roles = (await rest.get(Routes.guildRoles(guildId))) as RESTGetAPIGuildRolesResult

  return {
    guildId,
    rest,
    roles,
    rolesByName: new Map([...roles].reverse().map((role) => [role.name, role] as const)),
  }
}

export async function ensureDiscordRole(
  ctx: Pick<DiscordContext, 'env'>,
  options: EnsureDiscordRoleOptions,
): Promise<EnsureDiscordRoleResult> {
  const guildId = getDiscordGuildId(ctx, options.guildId)

  if (options.state && options.state.guildId !== guildId) {
    throw new Error(
      `Discord role provisioning state guild mismatch: expected ${guildId}, received ${options.state.guildId}`,
    )
  }

  const rest = options.state?.rest ?? getDiscordRoleRestClient(ctx, options)
  const matchingRole = findDiscordRoleByName({
    canUseExistingRole: options.canUseExistingRole,
    name: options.name,
    roles: options.state
      ? (options.state.roles ?? ((await rest.get(Routes.guildRoles(guildId))) as RESTGetAPIGuildRolesResult))
      : ((await rest.get(Routes.guildRoles(guildId))) as RESTGetAPIGuildRolesResult),
  })

  if (matchingRole) {
    return {
      created: false,
      roleId: matchingRole.id,
      roleName: matchingRole.name,
    }
  }

  const role = (await rest.post(Routes.guildRoles(guildId), {
    body: {
      name: options.name,
    } satisfies RESTPostAPIGuildRoleJSONBody,
  })) as RESTPostAPIGuildRoleResult

  options.state?.rolesByName.set(role.name, role)
  options.state?.roles?.push(role)

  return {
    created: true,
    roleId: role.id,
    roleName: role.name,
  }
}

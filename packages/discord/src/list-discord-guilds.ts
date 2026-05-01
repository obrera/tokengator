import { REST, Routes } from 'discord.js'

import type { DiscordContext } from './discord-context'
import { getDiscordBotToken } from './discord-env'

export interface DiscordGuildListRecord {
  id: string
  name: string
}

type DiscordRestRoute = `/${string}`

export interface ListDiscordGuildsOptions {
  rest?: {
    get(route: DiscordRestRoute): Promise<unknown>
  }
  token?: string
}

type DiscordGuildApiRecord = {
  id?: unknown
  name?: unknown
}

function getDiscordUserGuildsRoute(): DiscordRestRoute {
  const routeFactory = (Routes as { userGuilds?: () => string }).userGuilds

  return routeFactory ? (routeFactory() as DiscordRestRoute) : '/users/@me/guilds'
}

function toDiscordGuildListRecord(record: DiscordGuildApiRecord): DiscordGuildListRecord | null {
  if (typeof record.id !== 'string') {
    return null
  }

  return {
    id: record.id,
    name: typeof record.name === 'string' && record.name.trim() ? record.name : record.id,
  }
}

export async function listDiscordGuilds(
  ctx: Pick<DiscordContext, 'env'>,
  options: ListDiscordGuildsOptions = {},
): Promise<DiscordGuildListRecord[]> {
  const token = getDiscordBotToken(ctx, options.token)
  const rest = options.rest ?? new REST({ version: '10' }).setToken(token)
  const response = await rest.get(getDiscordUserGuildsRoute())
  const records = Array.isArray(response) ? (response as DiscordGuildApiRecord[]) : []

  return records
    .map((record) => toDiscordGuildListRecord(record))
    .filter((record): record is DiscordGuildListRecord => Boolean(record))
    .sort((left, right) => left.name.localeCompare(right.name) || left.id.localeCompare(right.id))
}

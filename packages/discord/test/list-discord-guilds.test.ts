import { describe, expect, test } from 'bun:test'

import type { DiscordEnv } from '@tokengator/env/discord'

import { listDiscordGuilds } from '../src/list-discord-guilds'

const baseEnv = {
  API_URL: 'https://api.example.com',
  DISCORD_BOT_START: true,
  DISCORD_BOT_TOKEN: 'bot-token',
  DISCORD_CLIENT_ID: 'client-id',
  DISCORD_GUILD_ID: 'guild-id',
  LOG_DEBUG_CATEGORIES: [],
  LOG_JSON: false,
  NODE_ENV: 'development',
  WEB_URL: 'https://app.example.com',
} satisfies DiscordEnv

describe('listDiscordGuilds', () => {
  test('returns sorted guilds from the bot account guild list', async () => {
    const routes: string[] = []
    const guilds = await listDiscordGuilds(
      {
        env: baseEnv,
      },
      {
        rest: {
          async get(route) {
            routes.push(route)

            return [
              {
                id: '223456789012345678',
                name: 'Zulu Guild',
              },
              {
                id: '123456789012345678',
                name: 'Acme Guild',
              },
            ]
          },
        },
      },
    )

    expect(routes).toEqual(['/users/@me/guilds'])
    expect(guilds).toEqual([
      {
        id: '123456789012345678',
        name: 'Acme Guild',
      },
      {
        id: '223456789012345678',
        name: 'Zulu Guild',
      },
    ])
  })
})

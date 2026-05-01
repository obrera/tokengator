import type z from 'zod'

import type { adminOrganizationListDiscordGuildsInputSchema } from './admin-organization-list-discord-guilds-input-schema'

export type AdminOrganizationListDiscordGuildsInput = z.infer<typeof adminOrganizationListDiscordGuildsInputSchema>

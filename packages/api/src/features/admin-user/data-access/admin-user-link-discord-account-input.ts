import z from 'zod'

import { adminUserLinkDiscordAccountInputSchema } from './admin-user-link-discord-account-input-schema'

export type AdminUserLinkDiscordAccountInput = z.infer<typeof adminUserLinkDiscordAccountInputSchema>

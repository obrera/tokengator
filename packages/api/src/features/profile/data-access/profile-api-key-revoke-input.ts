import type { z } from 'zod'

import type { profileApiKeyRevokeInputSchema } from './profile-api-key-revoke-input-schema'

export type ProfileRevokeApiKeyInput = z.infer<typeof profileApiKeyRevokeInputSchema>

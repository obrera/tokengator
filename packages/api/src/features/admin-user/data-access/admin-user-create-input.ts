import z from 'zod'

import { adminUserCreateInputSchema } from './admin-user-create-input-schema'

export type AdminUserCreateInput = z.infer<typeof adminUserCreateInputSchema>

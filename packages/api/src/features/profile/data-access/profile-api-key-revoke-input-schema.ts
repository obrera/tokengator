import { z } from 'zod'

export const profileApiKeyRevokeInputSchema = z.object({
  id: z.string().min(1),
})

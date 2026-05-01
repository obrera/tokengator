import z from 'zod'

export const adminUserLinkSolanaWalletInputSchema = z.object({
  address: z.string().trim().min(1),
  isPrimary: z.boolean().optional(),
  name: z.string().nullable().optional(),
  userId: z.string().min(1),
})

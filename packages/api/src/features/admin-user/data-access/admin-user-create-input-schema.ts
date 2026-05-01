import z from 'zod'

export const adminUserCreateInputSchema = z.object({
  email: z.string().email(),
  emailVerified: z.boolean().optional(),
  image: z.string().nullable().optional(),
  name: z.string().trim().min(1),
  role: z.enum(['admin', 'user']).optional(),
  username: z.string().nullable().optional(),
})

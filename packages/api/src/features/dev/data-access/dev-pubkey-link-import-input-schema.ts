import z from 'zod'

const httpUrlPattern = /^https?:\/\//i

export const devPubkeyLinkImportInputSchema = z.object({
  sourceUrl: z
    .string()
    .trim()
    .url()
    .refine((value) => httpUrlPattern.test(value), {
      message: 'Source URL must use http or https.',
    }),
})

export type DevPubkeyLinkImportInput = z.infer<typeof devPubkeyLinkImportInputSchema>

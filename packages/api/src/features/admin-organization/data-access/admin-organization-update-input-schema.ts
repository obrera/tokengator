import z from 'zod'

const adminOrganizationUrlSchema = z.string().url()
const adminOrganizationOptionalUrlSchema = z
  .string()
  .trim()
  .refine((value) => value.length === 0 || adminOrganizationUrlSchema.safeParse(value).success, {
    message: 'Invalid URL',
  })
  .optional()
const communityDescriptionMaxLength = 256

export const adminOrganizationUpdateInputSchema = z.object({
  data: z.object({
    description: z.string().trim().max(communityDescriptionMaxLength).optional(),
    discordUrl: adminOrganizationOptionalUrlSchema,
    githubUrl: adminOrganizationOptionalUrlSchema,
    logo: z.string().optional(),
    name: z.string().trim().min(1),
    slug: z.string().trim().min(1),
    telegramUrl: adminOrganizationOptionalUrlSchema,
    websiteUrl: adminOrganizationOptionalUrlSchema,
    xUrl: adminOrganizationOptionalUrlSchema,
  }),
  organizationId: z.string().min(1),
})

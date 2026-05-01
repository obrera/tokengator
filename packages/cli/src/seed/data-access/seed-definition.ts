import { existsSync, readFileSync } from 'node:fs'
import { dirname, isAbsolute, resolve } from 'node:path'
import z from 'zod'

const positiveIntegerStringSchema = z
  .string()
  .trim()
  .regex(/^[1-9]\d*$/, 'Amount must be a positive integer.')

const seedAssetGroupSchema = z.object({
  address: z.string().trim().min(1),
  enabled: z.boolean(),
  imageUrl: z.string().trim().min(1),
  label: z.string().trim().min(1),
  resolverKind: z.enum(['helius-collection-assets', 'helius-token-accounts', 'realms-voters']),
  type: z.enum(['collection', 'mint']),
})

const seedCommunityRoleSchema = z.object({
  conditions: z
    .array(
      z.object({
        assetGroupLabel: z.string().trim().min(1),
        maximumAmount: positiveIntegerStringSchema.nullable(),
        minimumAmount: positiveIntegerStringSchema,
      }),
    )
    .min(1),
  enabled: z.boolean(),
  matchMode: z.enum(['all', 'any']),
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
})

const seedOrganizationSchema = z.object({
  description: z.string().optional(),
  discordUrl: z.string().optional(),
  githubUrl: z.string().optional(),
  logo: z.string().optional(),
  members: z.array(
    z.object({
      role: z.enum(['admin', 'member', 'owner']),
      username: z.string().trim().min(1),
    }),
  ),
  name: z.string().trim().min(1),
  slug: z.string().trim().min(1),
  telegramUrl: z.string().optional(),
  websiteUrl: z.string().optional(),
  xUrl: z.string().optional(),
})

const seedUserSchema = z.object({
  discord: z.object({
    accountId: z.string().trim().min(1),
  }),
  email: z.string().email(),
  emailVerified: z.boolean(),
  image: z.string().trim().min(1),
  name: z.string().trim().min(1),
  role: z.enum(['admin', 'user']),
  solana: z
    .object({
      publicKey: z.string().trim().min(1),
      secret: z.array(z.number().int().min(0).max(255)).length(64),
    })
    .optional(),
  username: z.string().trim().min(1),
})

export const seedDefinitionSchema = z.object({
  assetGroups: z.array(seedAssetGroupSchema),
  bootstrapUsername: z.string().trim().min(1),
  communityRoles: z.array(seedCommunityRoleSchema),
  discordGuildIdEnv: z.string().trim().min(1).optional(),
  discordOrganizationSlug: z.string().trim().min(1).optional(),
  organizations: z.array(seedOrganizationSchema),
  users: z.array(seedUserSchema),
})

export type SeedDefinition = z.infer<typeof seedDefinitionSchema>
export type SeedUser = SeedDefinition['users'][number]

export function getSeedUserByUsername(definition: SeedDefinition, username: string): SeedUser {
  const user = definition.users.find((candidate) => candidate.username === username)

  if (!user) {
    throw new Error(`Seed user "${username}" was not found.`)
  }

  return user
}

export function resolveSeedDefinitionPath(path: string, cwd = process.cwd()): string {
  if (isAbsolute(path)) {
    return path
  }

  const directPath = resolve(cwd, path)

  if (existsSync(directPath)) {
    return directPath
  }

  let currentDirectory = resolve(cwd)

  while (true) {
    const candidatePath = resolve(currentDirectory, path)

    if (existsSync(candidatePath)) {
      return candidatePath
    }

    const parentDirectory = dirname(currentDirectory)

    if (parentDirectory === currentDirectory) {
      return directPath
    }

    currentDirectory = parentDirectory
  }
}

export function loadSeedDefinition(path: string): SeedDefinition {
  let parsed: unknown

  try {
    parsed = JSON.parse(readFileSync(resolveSeedDefinitionPath(path), 'utf8'))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'

    throw new Error(`Unable to read seed definition "${path}": ${message}`)
  }

  return seedDefinitionSchema.parse(parsed)
}

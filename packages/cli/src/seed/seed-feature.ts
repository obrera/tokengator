import {
  AdminApiError,
  createAdminApiClient,
  createPublicApiClient,
  type AdminApiClient,
} from '../api/data-access/admin-api-client'
import { deleteApiKey } from '../auth/data-access/auth-api-client'
import { createSiwsApiKey } from '../auth/data-access/auth-siws-login'
import { getApiUrl, type ProfileOptions } from '../config/data-access/config-store'
import { validateApiUrl } from '../config/util/config-validation'
import { loadSeedDefinition, type SeedDefinition, type SeedUser } from './data-access/seed-definition'

type SeedApplyOptions = ProfileOptions & {
  apiUrl?: string
  definitionFile: string
  verbose?: boolean
}

const CLI_API_KEY_EXPIRES_IN = 60 * 60
const SEED_SKIPPED_MESSAGE = 'Skipping local development seed because existing user or organization data was found.'
const SIWS_SIGN_IN_STATEMENT = 'Sign in to Tokengator'

function assertLocalApiUrl(apiUrl: string) {
  const url = new URL(apiUrl)
  const localHosts = new Set(['127.0.0.1', '::1', '[::1]', 'localhost'])

  if (!localHosts.has(url.hostname)) {
    throw new Error('seed apply only supports local API URLs.')
  }
}

function resolveApiUrl(options: SeedApplyOptions) {
  return validateApiUrl(options.apiUrl ?? getApiUrl(options))
}

function createSeedOrganizationSummary(
  definition: SeedDefinition,
  organization: SeedDefinition['organizations'][number],
) {
  const members = organization.members
    .map((membership) => {
      const user = definition.users.find((candidate) => candidate.username === membership.username)

      if (!user) {
        throw new Error(`Seed user ${membership.username} must exist before printing organization summaries.`)
      }

      return `@${user.username} ${membership.role}`
    })
    .join(', ')

  return `Organization: ${organization.name} (${organization.slug}) [${members}]`
}

function getBootstrapUser(definition: SeedDefinition): SeedUser & { solana: NonNullable<SeedUser['solana']> } {
  const user = definition.users.find((candidate) => candidate.username === definition.bootstrapUsername)

  if (!user) {
    throw new Error(`Bootstrap seed user "${definition.bootstrapUsername}" was not found.`)
  }

  if (!user.solana) {
    throw new Error(`Bootstrap seed user "${definition.bootstrapUsername}" must have a Solana fixture.`)
  }

  return user as SeedUser & { solana: NonNullable<SeedUser['solana']> }
}

function getDiscordOrganizationSlug(definition: SeedDefinition) {
  if (!definition.discordOrganizationSlug) {
    throw new Error('Seed definition with discordGuildIdEnv must include discordOrganizationSlug.')
  }

  return definition.discordOrganizationSlug
}

function getRequiredId(idsByKey: Map<string, string>, key: string, label: string) {
  const id = idsByKey.get(key)

  if (!id) {
    throw new Error(`Missing ${label} id for ${key}.`)
  }

  return id
}

function getRequiredOwner(organization: SeedDefinition['organizations'][number]) {
  const owner = organization.members.find((member) => member.role === 'owner') ?? organization.members[0]

  if (!owner) {
    throw new Error(`Seed organization "${organization.slug}" must have at least one member.`)
  }

  return owner
}

function printSeedSummary(definition: SeedDefinition) {
  console.log(
    [
      'Seeded local development data.',
      `Users: ${definition.users.map((user) => `${user.name} (@${user.username})`).join(', ')}`,
      `Solana sign-in fixtures: ${definition.users
        .filter((user) => user.solana)
        .map((user) => `@${user.username}`)
        .join(', ')}`,
      ...definition.organizations.map((organization) => createSeedOrganizationSummary(definition, organization)),
      `Seeded organizations: ${definition.organizations.length}`,
      `Seeded users: ${definition.users.length}`,
    ].join('\n'),
  )
}

async function applySeedAssetGroups(apiClient: AdminApiClient, definition: SeedDefinition) {
  const assetGroupIdsByLabel = new Map<string, string>()

  for (const assetGroup of definition.assetGroups) {
    const createdAssetGroup = await apiClient.assetGroupCreate(assetGroup)

    assetGroupIdsByLabel.set(assetGroup.label, createdAssetGroup.id)
  }

  return assetGroupIdsByLabel
}

async function applySeedCommunityRoles(input: {
  apiClient: AdminApiClient
  assetGroupIdsByLabel: Map<string, string>
  definition: SeedDefinition
  organizationIdsBySlug: Map<string, string>
}) {
  const { apiClient, assetGroupIdsByLabel, definition, organizationIdsBySlug } = input

  for (const organization of definition.organizations) {
    const organizationId = getRequiredId(organizationIdsBySlug, organization.slug, 'organization')

    for (const communityRole of definition.communityRoles) {
      await apiClient.communityRoleCreate({
        data: {
          conditions: communityRole.conditions.map((condition) => ({
            assetGroupId: getRequiredId(assetGroupIdsByLabel, condition.assetGroupLabel, 'asset group'),
            maximumAmount: condition.maximumAmount,
            minimumAmount: condition.minimumAmount,
          })),
          enabled: communityRole.enabled,
          matchMode: communityRole.matchMode,
          name: communityRole.name,
          slug: communityRole.slug,
        },
        organizationId,
      })
    }
  }
}

async function applySeedOrganizations(input: {
  apiClient: AdminApiClient
  definition: SeedDefinition
  userIdsByUsername: Map<string, string>
}) {
  const { apiClient, definition, userIdsByUsername } = input
  const organizationIdsBySlug = new Map<string, string>()

  for (const organization of definition.organizations) {
    const owner = getRequiredOwner(organization)
    const ownerUserId = getRequiredId(userIdsByUsername, owner.username, 'user')
    const createdOrganization = await apiClient.organizationCreate({
      logo: organization.logo,
      name: organization.name,
      ownerUserId,
      slug: organization.slug,
    })
    const updatedOrganization = await apiClient.organizationUpdate({
      data: {
        description: organization.description ?? '',
        discordUrl: organization.discordUrl ?? '',
        githubUrl: organization.githubUrl ?? '',
        logo: organization.logo ?? '',
        name: organization.name,
        slug: organization.slug,
        telegramUrl: organization.telegramUrl ?? '',
        websiteUrl: organization.websiteUrl ?? '',
        xUrl: organization.xUrl ?? '',
      },
      organizationId: createdOrganization.id,
    })

    organizationIdsBySlug.set(organization.slug, updatedOrganization.id)

    for (const member of organization.members) {
      await apiClient.organizationAddMember({
        organizationId: updatedOrganization.id,
        role: member.role,
        userId: getRequiredId(userIdsByUsername, member.username, 'user'),
      })
    }
  }

  return organizationIdsBySlug
}

async function applySeedUsers(input: {
  apiClient: AdminApiClient
  bootstrapUserId: string
  definition: SeedDefinition
}) {
  const { apiClient, bootstrapUserId, definition } = input
  const userIdsByUsername = new Map<string, string>()

  for (const seedUser of definition.users) {
    const user =
      seedUser.username === definition.bootstrapUsername
        ? await apiClient.userUpdate({
            data: {
              email: seedUser.email,
              emailVerified: seedUser.emailVerified,
              image: seedUser.image,
              name: seedUser.name,
              role: seedUser.role,
              username: seedUser.username,
            },
            userId: bootstrapUserId,
          })
        : await apiClient.userCreate({
            email: seedUser.email,
            emailVerified: seedUser.emailVerified,
            image: seedUser.image,
            name: seedUser.name,
            role: seedUser.role,
            username: seedUser.username,
          })

    userIdsByUsername.set(seedUser.username, user.id)

    await apiClient.userLinkDiscordAccount({
      accountId: seedUser.discord.accountId,
      userId: user.id,
    })

    if (seedUser.solana) {
      await apiClient.userLinkSolanaWallet({
        address: seedUser.solana.publicKey,
        isPrimary: true,
        userId: user.id,
      })
    }
  }

  return userIdsByUsername
}

export async function seedFeatureApply(options: SeedApplyOptions) {
  const apiUrl = resolveApiUrl(options)

  assertLocalApiUrl(apiUrl)
  const definition = loadSeedDefinition(options.definitionFile)
  const publicApiClient = createPublicApiClient({
    apiUrl,
    verbose: options.verbose,
  })
  let status

  try {
    status = await publicApiClient.coreStatus()
  } catch (error) {
    if (error instanceof AdminApiError && error.status === 404) {
      throw new Error(
        [
          `Unable to load core status from ${apiUrl}.`,
          'The running API does not expose core.status.',
          'Restart the API from this branch, or pass --api-url to the local API process that is running this code.',
        ].join(' '),
      )
    }

    throw error
  }

  if (status.configured) {
    console.log(SEED_SKIPPED_MESSAGE)
    return {
      skipped: true as const,
    }
  }

  const bootstrapUser = getBootstrapUser(definition)
  const { apiKey, session } = await createSiwsApiKey({
    apiKeyName: 'Tokengator CLI seed bootstrap',
    apiUrl,
    expiresIn: CLI_API_KEY_EXPIRES_IN,
    fixture: bootstrapUser.solana,
    metadata: {
      clientId: 'tokengator-cli-seed',
      username: bootstrapUser.username,
    },
    statement: SIWS_SIGN_IN_STATEMENT,
    verbose: options.verbose,
  })

  if (session.user.role !== 'admin') {
    await deleteApiKey({
      apiKey: apiKey.key,
      apiUrl,
      keyId: apiKey.id,
      verbose: options.verbose,
    }).catch(() => {})
    throw new Error(`Bootstrap seed user "${bootstrapUser.username}" did not resolve to an admin session.`)
  }

  const apiClient = createAdminApiClient({
    credentials: {
      apiKey: apiKey.key,
      apiUrl,
    },
    verbose: options.verbose,
  })

  try {
    const userIdsByUsername = await applySeedUsers({
      apiClient,
      bootstrapUserId: session.user.id,
      definition,
    })
    const assetGroupIdsByLabel = await applySeedAssetGroups(apiClient, definition)
    const organizationIdsBySlug = await applySeedOrganizations({
      apiClient,
      definition,
      userIdsByUsername,
    })
    const guildId = definition.discordGuildIdEnv ? process.env[definition.discordGuildIdEnv]?.trim() : undefined

    if (guildId) {
      await apiClient.organizationUpsertDiscordConnection({
        guildId,
        organizationId: getRequiredId(organizationIdsBySlug, getDiscordOrganizationSlug(definition), 'organization'),
      })
    }

    await applySeedCommunityRoles({
      apiClient,
      assetGroupIdsByLabel,
      definition,
      organizationIdsBySlug,
    })
    printSeedSummary(definition)

    return {
      skipped: false as const,
    }
  } finally {
    await deleteApiKey({
      apiKey: apiKey.key,
      apiUrl,
      keyId: apiKey.id,
      verbose: options.verbose,
    }).catch(() => {})
  }
}

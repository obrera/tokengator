import type {
  AdminApiClient,
  AdminApiFetch,
  AdminOrganization,
  AdminOrganizationListInput,
  AdminOrganizationListOwnerCandidatesInput,
} from '../api/data-access/admin-api-client'
import type { ProfileOptions } from '../config/data-access/config-store'
import { createAdminApiClient } from '../api/data-access/admin-api-client'
import { confirmDestructiveAction, printJson } from '../api/ui/api-output'
import { getOptionalNumber, getOptionalString, pickDefined } from '../api/util/command-options'
import {
  communitiesUiPrintCommunity,
  communitiesUiPrintCommunityDeleted,
  communitiesUiPrintCommunityList,
  communitiesUiPrintOwnerCandidates,
} from './communities-ui'

type CommunitiesFeatureOptions = ProfileOptions & {
  apiClient?: AdminApiClient
  fetch?: AdminApiFetch
  json?: boolean
  signal?: AbortSignal
  verbose?: boolean
}

type CommunitiesCreateOptions = CommunitiesFeatureOptions & {
  logo?: string
  name: string
  ownerUserId: string
  slug: string
}

type CommunitiesDeleteOptions = CommunitiesFeatureOptions & {
  yes?: boolean
}

type CommunitiesListOptions = CommunitiesFeatureOptions & {
  limit?: number
  offset?: number
  search?: string
}

type CommunitiesOwnerCandidatesOptions = CommunitiesFeatureOptions & {
  limit?: number
  search?: string
}

type CommunitiesUpdateOptions = CommunitiesFeatureOptions & {
  clearDescription?: boolean
  clearDiscordUrl?: boolean
  clearGithubUrl?: boolean
  clearLogo?: boolean
  clearTelegramUrl?: boolean
  clearWebsiteUrl?: boolean
  clearXUrl?: boolean
  description?: string
  discordUrl?: string
  githubUrl?: string
  logo?: string
  name?: string
  slug?: string
  telegramUrl?: string
  websiteUrl?: string
  xUrl?: string
}

function getApiClient(options: CommunitiesFeatureOptions): AdminApiClient {
  return (
    options.apiClient ??
    createAdminApiClient({
      configPath: options.configPath,
      env: options.env,
      fetch: options.fetch,
      profile: options.profile,
      signal: options.signal,
      verbose: options.verbose,
    })
  )
}

function getMergedOptionalText(input: {
  clear?: boolean
  current?: string | null
  optionName: string
  value?: string
}): string {
  if (input.clear && input.value !== undefined) {
    throw new Error(`Use either --${input.optionName} or --clear-${input.optionName}.`)
  }

  if (input.clear) {
    return ''
  }

  if (input.value !== undefined) {
    return input.value
  }

  return input.current ?? ''
}

function requireCommunity(community: AdminOrganization | null, organizationId: string): AdminOrganization {
  if (!community) {
    throw new Error(`Community "${organizationId}" was not found.`)
  }

  return community
}

export async function communitiesFeatureCreate(options: CommunitiesCreateOptions) {
  const apiClient = getApiClient(options)
  const community = await apiClient.organizationCreate({
    name: options.name,
    ownerUserId: options.ownerUserId,
    slug: options.slug,
    ...pickDefined({
      logo: getOptionalString(options.logo),
    }),
  })

  if (options.json) {
    printJson(community)
    return
  }

  communitiesUiPrintCommunity(community)
}

export async function communitiesFeatureDelete(organizationId: string, options: CommunitiesDeleteOptions) {
  await confirmDestructiveAction({
    message: `Delete community "${organizationId}"?`,
    yes: options.yes,
  })

  const apiClient = getApiClient(options)
  const result = await apiClient.organizationDelete({ organizationId })

  if (options.json) {
    printJson(result)
    return
  }

  communitiesUiPrintCommunityDeleted(result.organizationId)
}

export async function communitiesFeatureGet(organizationId: string, options: CommunitiesFeatureOptions) {
  const apiClient = getApiClient(options)
  const community = requireCommunity(await apiClient.organizationGet({ organizationId }), organizationId)

  if (options.json) {
    printJson(community)
    return
  }

  communitiesUiPrintCommunity(community)
}

export async function communitiesFeatureList(options: CommunitiesListOptions) {
  const apiClient = getApiClient(options)
  const input = pickDefined<AdminOrganizationListInput>({
    limit: getOptionalNumber(options.limit),
    offset: getOptionalNumber(options.offset),
    search: getOptionalString(options.search),
  })
  const result = await apiClient.organizationList(input)

  if (options.json) {
    printJson(result)
    return
  }

  communitiesUiPrintCommunityList(result)
}

export async function communitiesFeatureOwnerCandidates(options: CommunitiesOwnerCandidatesOptions) {
  const apiClient = getApiClient(options)
  const input = pickDefined<AdminOrganizationListOwnerCandidatesInput>({
    limit: getOptionalNumber(options.limit),
    search: getOptionalString(options.search),
  })
  const candidates = await apiClient.organizationListOwnerCandidates(input)

  if (options.json) {
    printJson(candidates)
    return
  }

  communitiesUiPrintOwnerCandidates(candidates)
}

export async function communitiesFeatureUpdate(organizationId: string, options: CommunitiesUpdateOptions) {
  const apiClient = getApiClient(options)
  const current = requireCommunity(await apiClient.organizationGet({ organizationId }), organizationId)
  const community = await apiClient.organizationUpdate({
    data: {
      description: getMergedOptionalText({
        clear: options.clearDescription,
        current: current.description,
        optionName: 'description',
        value: options.description,
      }),
      discordUrl: getMergedOptionalText({
        clear: options.clearDiscordUrl,
        current: current.discordUrl,
        optionName: 'discord-url',
        value: options.discordUrl,
      }),
      githubUrl: getMergedOptionalText({
        clear: options.clearGithubUrl,
        current: current.githubUrl,
        optionName: 'github-url',
        value: options.githubUrl,
      }),
      logo: getMergedOptionalText({
        clear: options.clearLogo,
        current: current.logo,
        optionName: 'logo',
        value: options.logo,
      }),
      name: options.name ?? current.name,
      slug: options.slug ?? current.slug,
      telegramUrl: getMergedOptionalText({
        clear: options.clearTelegramUrl,
        current: current.telegramUrl,
        optionName: 'telegram-url',
        value: options.telegramUrl,
      }),
      websiteUrl: getMergedOptionalText({
        clear: options.clearWebsiteUrl,
        current: current.websiteUrl,
        optionName: 'website-url',
        value: options.websiteUrl,
      }),
      xUrl: getMergedOptionalText({
        clear: options.clearXUrl,
        current: current.xUrl,
        optionName: 'x-url',
        value: options.xUrl,
      }),
    },
    organizationId,
  })

  if (options.json) {
    printJson(community)
    return
  }

  communitiesUiPrintCommunity(community)
}

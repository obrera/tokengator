import { type AdminOrganization, type ApiClientOptions } from '../api/data-access/admin-api-client'
import { getApiClient } from '../api/data-access/get-api-client'
import { coreUiJson } from '../core/ui/core-ui-json'
import { communitiesUiPrintCommunity } from './ui/communities-ui-print-community'

type CommunitiesUpdateOptions = ApiClientOptions & {
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
  json?: boolean
  logo?: string
  name?: string
  slug?: string
  telegramUrl?: string
  websiteUrl?: string
  xUrl?: string
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
    coreUiJson(community)
    return
  }

  communitiesUiPrintCommunity(community)
}

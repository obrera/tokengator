import { cancel, confirm, intro, isCancel, select, text } from '@clack/prompts'
import pc from 'picocolors'

import type { ConfigApiUrlOption } from '../data-access/config-api-url-options'
import { DEFAULT_PROFILE_NAME, type TokengatorConfig } from '../data-access/config-store'
import { validateApiUrl, validateProfileName } from '../util/config-validation'

const CUSTOM_API_URL_OPTION = 'custom'

export type ConfigInitPromptResult = {
  apiUrl?: string
  existingProfile: boolean
  profile: string
}

function configUiGetInitialApiUrlChoice(apiUrl: string | undefined, apiUrlOptions: ConfigApiUrlOption[]): string {
  const matchingOption = apiUrlOptions.find((option) => option.url === apiUrl)

  return matchingOption?.url ?? (apiUrl ? CUSTOM_API_URL_OPTION : (apiUrlOptions[0]?.url ?? CUSTOM_API_URL_OPTION))
}

function configUiGetValidationMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Invalid value.'
}

async function configUiPromptForApiUrl(
  existingApiUrl: string | undefined,
  apiUrlOptions: ConfigApiUrlOption[],
): Promise<string | undefined> {
  const choice = await select<string>({
    initialValue: configUiGetInitialApiUrlChoice(existingApiUrl, apiUrlOptions),
    message: 'Which Tokengator API should this profile use?',
    options: [
      ...apiUrlOptions.map((option) => ({
        hint: option.url,
        label: option.name,
        value: option.url,
      })),
      {
        label: 'Custom',
        value: CUSTOM_API_URL_OPTION,
      },
    ],
  })

  if (isCancel(choice)) {
    cancel('Config init cancelled.')

    return undefined
  }

  if (choice !== CUSTOM_API_URL_OPTION) {
    return choice
  }

  const customApiUrl = await text({
    initialValue:
      existingApiUrl && !apiUrlOptions.some((option) => option.url === existingApiUrl) ? existingApiUrl : '',
    message: 'Custom API URL',
    placeholder: 'https://api.example.com',
    validate(value) {
      try {
        validateApiUrl(value ?? '')

        return undefined
      } catch (error) {
        return configUiGetValidationMessage(error)
      }
    },
  })

  if (isCancel(customApiUrl)) {
    cancel('Config init cancelled.')

    return undefined
  }

  return validateApiUrl(customApiUrl)
}

async function configUiPromptForProfileName(config: TokengatorConfig): Promise<string | undefined> {
  const profiles = Object.keys(config.profiles)

  if (profiles.length === 0) {
    return DEFAULT_PROFILE_NAME
  }

  const defaultProfile = config.profiles[config.activeProfile] ? config.activeProfile : profiles[0]

  const profileAnswer = await text({
    initialValue: defaultProfile,
    message: 'Profile name',
    placeholder: DEFAULT_PROFILE_NAME,
    validate(value) {
      try {
        validateProfileName(value ?? '')

        return undefined
      } catch (error) {
        return configUiGetValidationMessage(error)
      }
    },
  })

  if (isCancel(profileAnswer)) {
    cancel('Config init cancelled.')

    return undefined
  }

  return validateProfileName(profileAnswer)
}

export async function configUiPromptInit(options: {
  apiUrlOptions: ConfigApiUrlOption[]
  config: TokengatorConfig
}): Promise<ConfigInitPromptResult | undefined> {
  intro(pc.cyan('tokengator config init'))

  const profile = await configUiPromptForProfileName(options.config)

  if (!profile) {
    return undefined
  }

  const existingProfile = options.config.profiles[profile]
  let apiUrl = existingProfile?.apiUrl

  if (apiUrl) {
    const shouldUpdateApiUrl = await confirm({
      initialValue: false,
      message: `Profile "${profile}" already has an API URL. Update it?`,
    })

    if (isCancel(shouldUpdateApiUrl)) {
      cancel('Config init cancelled.')

      return undefined
    }

    if (shouldUpdateApiUrl) {
      apiUrl = await configUiPromptForApiUrl(apiUrl, options.apiUrlOptions)
    } else {
      return {
        existingProfile: true,
        profile,
      }
    }
  } else {
    apiUrl = await configUiPromptForApiUrl(apiUrl, options.apiUrlOptions)
  }

  if (!apiUrl) {
    return undefined
  }

  return {
    apiUrl,
    existingProfile: Boolean(existingProfile),
    profile,
  }
}

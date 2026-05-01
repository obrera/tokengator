import { hostname } from 'node:os'

import { createProfile, DEFAULT_PROFILE_NAME, setApiUrl, type ProfileOptions } from '../config/data-access/config-store'
import { ConfigError, validateApiUrl } from '../config/util/config-validation'
import { getSeedUserByUsername, loadSeedDefinition } from '../seed/data-access/seed-definition'
import { deleteApiKey } from './data-access/auth-api-client'
import { createSiwsApiKey, type SiwsFixture } from './data-access/auth-siws-login'
import { setStoredAuthCredentials } from './data-access/auth-token-store'
import { authUiPrintLoginSuccess } from './ui/auth-ui-print-login-success'

const CLI_API_KEY_EXPIRES_IN = 60 * 60 * 24 * 90
const SIWS_SIGN_IN_STATEMENT = 'Sign in to Tokengator'

function ensureProfile(input: { apiUrl: string; profile: string }) {
  try {
    setApiUrl(input.apiUrl, { profile: input.profile })
  } catch (error) {
    if (!(error instanceof ConfigError)) {
      throw error
    }

    createProfile(input.profile, input.apiUrl)
  }
}

function getCliApiKeyName(input: { hostname: string; profile: string; username: string }) {
  return `Tokengator CLI SIWS: ${input.profile} ${input.username} on ${input.hostname}`
}

export async function authFeatureSiwsLogin(
  options: ProfileOptions & {
    apiUrl: string
    definition: string
    user: string
    verbose?: boolean
  },
) {
  const apiUrl = validateApiUrl(options.apiUrl)
  const definition = loadSeedDefinition(options.definition)
  const seedUser = getSeedUserByUsername(definition, options.user)
  const profile = options.profile ?? DEFAULT_PROFILE_NAME
  const machineHostname = hostname()
  const apiKeyName = getCliApiKeyName({
    hostname: machineHostname,
    profile,
    username: seedUser.username,
  })

  if (!seedUser.solana) {
    throw new Error(`Seed user "${seedUser.username}" does not have a Solana fixture.`)
  }

  const { apiKey, session } = await createSiwsApiKey({
    apiKeyName,
    apiUrl,
    expiresIn: CLI_API_KEY_EXPIRES_IN,
    fixture: seedUser.solana satisfies SiwsFixture,
    metadata: {
      clientId: 'tokengator-cli-siws',
      hostname: machineHostname,
      username: seedUser.username,
    },
    statement: SIWS_SIGN_IN_STATEMENT,
    verbose: options.verbose,
  })

  try {
    ensureProfile({
      apiUrl,
      profile,
    })
    setStoredAuthCredentials(
      {
        apiKey: apiKey.key,
        apiKeyId: apiKey.id,
        apiKeyName: apiKey.name ?? apiKeyName,
        apiUrl,
        authenticatedAt: new Date().toISOString(),
        userId: session.user.id,
        username: session.user.username ?? seedUser.username,
      },
      {
        profile,
      },
    )
  } catch (error) {
    await deleteApiKey({
      apiKey: apiKey.key,
      apiUrl,
      keyId: apiKey.id,
      verbose: options.verbose,
    }).catch(() => {})

    throw error
  }

  authUiPrintLoginSuccess({
    apiKeyId: apiKey.id,
    apiKeyName: apiKey.name ?? apiKeyName,
    apiUrl,
    profile,
    user: session.user,
  })
}

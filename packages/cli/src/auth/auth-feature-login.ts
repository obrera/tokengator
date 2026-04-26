import { hostname } from 'node:os'

import { getAuthCredentials, getApiUrl, type ProfileOptions } from '../config/data-access/config-store'
import { AuthError, createApiKey, deleteApiKey, getSession, type AuthApiFetch } from './data-access/auth-api-client'
import { runDeviceAuthorizationFlow } from './data-access/auth-device-flow'
import { clearStoredAuthCredentials, setStoredAuthCredentials } from './data-access/auth-token-store'
import { authUiPrintLoginSuccess } from './ui/auth-ui-print-login-success'

const CLI_API_KEY_EXPIRES_IN = 60 * 60 * 24 * 90
const CLI_CLIENT_ID = 'tokengator-cli'

function getCliApiKeyName(input: { hostname: string; profile: string }) {
  return `Tokengator CLI: ${input.profile} on ${input.hostname}`
}

export async function authFeatureLogin(
  options: ProfileOptions & {
    fetch?: AuthApiFetch
    noOpen?: boolean
    signal?: AbortSignal
  } = {},
) {
  const apiUrl = getApiUrl(options)
  const profile = getAuthCredentials(options).profile
  const machineHostname = hostname()
  const apiKeyName = getCliApiKeyName({
    hostname: machineHostname,
    profile,
  })
  const deviceToken = await runDeviceAuthorizationFlow({
    apiUrl,
    fetch: options.fetch,
    noOpen: options.noOpen,
    signal: options.signal,
  })
  const apiKey = await createApiKey({
    accessToken: deviceToken.access_token,
    apiUrl,
    expiresIn: CLI_API_KEY_EXPIRES_IN,
    fetch: options.fetch,
    metadata: {
      clientId: CLI_CLIENT_ID,
      hostname: machineHostname,
    },
    name: apiKeyName,
    signal: options.signal,
  })

  if (!apiKey.id || !apiKey.key) {
    throw new AuthError('API key creation did not return a usable key.')
  }

  try {
    const session = await getSession({
      apiKey: apiKey.key,
      apiUrl,
      fetch: options.fetch,
      signal: options.signal,
    })

    if (!session) {
      throw new AuthError('API key verification failed. Run "tokengator auth login" again.')
    }

    const storedApiKeyName = apiKey.name ?? apiKeyName

    clearStoredAuthCredentials(options)
    setStoredAuthCredentials(
      {
        apiKey: apiKey.key,
        apiKeyId: apiKey.id,
        apiKeyName: storedApiKeyName,
        apiUrl,
        authenticatedAt: new Date().toISOString(),
        userId: session.user.id,
        username: session.user.username ?? undefined,
      },
      options,
    )
    authUiPrintLoginSuccess({
      apiKeyId: apiKey.id,
      apiKeyName: storedApiKeyName,
      apiUrl,
      profile,
      user: session.user,
    })
  } catch (error) {
    await deleteApiKey({
      apiKey: apiKey.key,
      apiUrl,
      fetch: options.fetch,
      keyId: apiKey.id,
      signal: options.signal,
    }).catch(() => {})

    throw error
  }
}

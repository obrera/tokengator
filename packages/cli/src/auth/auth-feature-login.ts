import { hostname } from 'node:os'

import { getAuthCredentials, getApiUrl, type ProfileOptions } from '../config/data-access/config-store'
import { AuthError, createApiKey, deleteApiKey, getSession, type AuthApiFetch } from './data-access/auth-api-client'
import { runDeviceAuthorizationFlow } from './data-access/auth-device-flow'
import { clearStoredAuthCredentials, setStoredAuthCredentials } from './data-access/auth-token-store'
import { authUiPrintLoginSuccess } from './ui/auth-ui-print-login-success'

const CLI_API_KEY_EXPIRES_IN = 60 * 60 * 24 * 90
const CLI_CLIENT_ID = 'tokengator-cli'

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
    name: `Tokengator CLI on ${machineHostname}`,
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

    const apiKeyName = apiKey.name ?? `Tokengator CLI on ${machineHostname}`

    clearStoredAuthCredentials(options)
    setStoredAuthCredentials(
      {
        apiKey: apiKey.key,
        apiKeyId: apiKey.id,
        apiKeyName,
        apiUrl,
        authenticatedAt: new Date().toISOString(),
        userId: session.user.id,
        username: session.user.username ?? undefined,
      },
      options,
    )
    authUiPrintLoginSuccess({
      apiKeyId: apiKey.id,
      apiKeyName,
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

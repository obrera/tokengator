import type { ProfileOptions } from '../config/data-access/config-store'
import { deleteApiKey, type AuthApiFetch } from './data-access/auth-api-client'
import { clearStoredAuthCredentials, getStoredAuthCredentials } from './data-access/auth-token-store'
import { authUiPrintLogoutSuccess } from './ui/auth-ui-print-logout-success'

export async function authFeatureLogout(
  options: ProfileOptions & {
    fetch?: AuthApiFetch
    signal?: AbortSignal
  } = {},
) {
  const credentials = getStoredAuthCredentials(options)
  let revokeFailed = false

  if (credentials.apiKey && credentials.apiKeyId && credentials.apiUrl) {
    try {
      await deleteApiKey({
        apiKey: credentials.apiKey,
        apiUrl: credentials.apiUrl,
        fetch: options.fetch,
        keyId: credentials.apiKeyId,
        signal: options.signal,
      })
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error
      }

      revokeFailed = true
    }
  }

  const { profile } = clearStoredAuthCredentials(options)

  authUiPrintLogoutSuccess({
    profile,
    revokeFailed,
  })
}

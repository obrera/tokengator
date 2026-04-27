import type { ProfileOptions } from '../config/data-access/config-store'
import { AuthError, deleteApiKey, type AuthApiFetch } from './data-access/auth-api-client'
import { clearStoredAuthCredentials, getStoredAuthCredentials } from './data-access/auth-token-store'
import { authUiPrintLogoutSuccess } from './ui/auth-ui-print-logout-success'

function getRevokeFailureDetails(error: unknown): string[] | undefined {
  if (error instanceof AuthError) {
    return [error.message, ...(error.details ?? [])]
  }

  if (error instanceof Error) {
    return [error.message]
  }

  return undefined
}

export async function authFeatureLogout(
  options: ProfileOptions & {
    fetch?: AuthApiFetch
    signal?: AbortSignal
    verbose?: boolean
  } = {},
) {
  const credentials = getStoredAuthCredentials(options)
  let revokeFailed = false
  let revokeFailureDetails: string[] | undefined

  if (credentials.apiKey && credentials.apiKeyId && credentials.apiUrl) {
    try {
      await deleteApiKey({
        apiKey: credentials.apiKey,
        apiUrl: credentials.apiUrl,
        fetch: options.fetch,
        keyId: credentials.apiKeyId,
        signal: options.signal,
        verbose: options.verbose,
      })
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error
      }

      if (options.verbose) {
        revokeFailureDetails = getRevokeFailureDetails(error)
      }

      revokeFailed = true
    }
  }

  const { profile } = clearStoredAuthCredentials(options)

  authUiPrintLogoutSuccess({
    profile,
    revokeFailed,
    revokeFailureDetails,
  })
}

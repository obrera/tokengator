import type { ProfileOptions } from '../config/data-access/config-store'
import { AuthError, getSession, type AuthApiFetch } from './data-access/auth-api-client'
import { requireStoredAuthCredentials } from './data-access/auth-token-store'
import { authUiPrintWhoami } from './ui/auth-ui-print-whoami'

export async function authFeatureWhoami(
  options: ProfileOptions & {
    fetch?: AuthApiFetch
    signal?: AbortSignal
    verbose?: boolean
  } = {},
) {
  const credentials = requireStoredAuthCredentials(options)
  let session: Awaited<ReturnType<typeof getSession>>

  try {
    session = await getSession({
      apiKey: credentials.apiKey,
      apiUrl: credentials.apiUrl,
      fetch: options.fetch,
      signal: options.signal,
      verbose: options.verbose,
    })
  } catch (error) {
    if (error instanceof AuthError && (error.status === 401 || error.status === 403 || error.status === 404)) {
      throw new AuthError('Stored API key is invalid. Run "tokengator auth login".', {
        code: error.code,
        details: error.details,
        status: error.status,
      })
    }

    throw error
  }

  if (!session) {
    throw new AuthError('Stored API key is invalid. Run "tokengator auth login".')
  }

  authUiPrintWhoami({
    apiKeyName: credentials.apiKeyName,
    apiUrl: credentials.apiUrl,
    profile: credentials.profile,
    user: session.user,
  })
}

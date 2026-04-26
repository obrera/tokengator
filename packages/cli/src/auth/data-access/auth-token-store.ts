import {
  clearAuthCredentials,
  getAuthCredentials,
  setAuthCredentials,
  type ProfileOptions,
  type TokengatorAuthCredentials,
} from '../../config/data-access/config-store'
import { ConfigError } from '../../config/util/config-validation'

export type RequiredAuthCredentials = TokengatorAuthCredentials & {
  apiKey: string
  apiUrl: string
}

export function clearStoredAuthCredentials(options: ProfileOptions = {}) {
  return clearAuthCredentials(options)
}

export function getAuthenticatedHeaders(options: ProfileOptions = {}): Headers {
  const credentials = requireStoredAuthCredentials(options)

  return new Headers({
    'x-api-key': credentials.apiKey,
  })
}

export function getStoredAuthCredentials(options: ProfileOptions = {}) {
  return getAuthCredentials(options)
}

export function requireStoredAuthCredentials(options: ProfileOptions = {}): RequiredAuthCredentials {
  const credentials = getAuthCredentials(options)

  if (!credentials.apiUrl) {
    throw new ConfigError(`API URL is not set for profile "${credentials.profile}". Run "tokengator config init".`)
  }

  if (!credentials.apiKey) {
    throw new ConfigError(`Not logged in for profile "${credentials.profile}". Run "tokengator auth login".`)
  }

  return credentials as RequiredAuthCredentials
}

export function setStoredAuthCredentials(
  credentials: Omit<TokengatorAuthCredentials, 'profile'>,
  options: ProfileOptions = {},
) {
  return setAuthCredentials(credentials, options)
}

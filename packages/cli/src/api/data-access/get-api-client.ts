import { type AdminApiClient, type ApiClientOptions, createAdminApiClient } from './admin-api-client'

export function getApiClient(options: ApiClientOptions = {}): AdminApiClient {
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

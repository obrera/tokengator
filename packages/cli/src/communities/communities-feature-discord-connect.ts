import { type ApiClientOptions } from '../api/data-access/admin-api-client'
import { getApiClient } from '../api/data-access/get-api-client'
import { coreUiJson } from '../core/ui/core-ui-json'
import { communitiesUiPrintDiscordConnection } from './ui/communities-ui-print-discord-connection'

type CommunitiesConnectDiscordOptions = ApiClientOptions & {
  guildId: string
  json?: boolean
}

export async function communitiesFeatureDiscordConnect(
  organizationId: string,
  options: CommunitiesConnectDiscordOptions,
) {
  const apiClient = getApiClient(options)
  const connection = await apiClient.organizationUpsertDiscordConnection({
    guildId: options.guildId,
    organizationId,
  })

  if (options.json) {
    coreUiJson(connection)
    return
  }

  communitiesUiPrintDiscordConnection(connection)
}

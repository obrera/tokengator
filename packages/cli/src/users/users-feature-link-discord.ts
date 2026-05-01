import { type ApiClientOptions } from '../api/data-access/admin-api-client'
import { getApiClient } from '../api/data-access/get-api-client'
import { coreUiJson } from '../core/ui/core-ui-json'
import { usersUiPrintUser } from './ui/users-ui-print-user'

type UsersLinkDiscordOptions = ApiClientOptions & {
  accountId: string
  json?: boolean
}

export async function usersFeatureLinkDiscord(userId: string, options: UsersLinkDiscordOptions) {
  const apiClient = getApiClient(options)
  const user = await apiClient.userLinkDiscordAccount({
    accountId: options.accountId,
    userId,
  })

  if (options.json) {
    coreUiJson(user)
    return
  }

  usersUiPrintUser(user)
}

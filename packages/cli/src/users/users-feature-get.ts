import { type ApiClientOptions } from '../api/data-access/admin-api-client'
import { getApiClient } from '../api/data-access/get-api-client'
import { coreUiJson } from '../core/ui/core-ui-json'
import { usersUiPrintUser } from './ui/users-ui-print-user'

type UsersGetOptions = ApiClientOptions & {
  json?: boolean
}

export async function usersFeatureGet(userId: string, options: UsersGetOptions) {
  const apiClient = getApiClient(options)
  const user = await apiClient.userGet({ userId })

  if (!user) {
    throw new Error(`User "${userId}" was not found.`)
  }

  if (options.json) {
    coreUiJson(user)
    return
  }

  usersUiPrintUser(user)
}

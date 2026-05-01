import { type AdminUserListInput, type ApiClientOptions } from '../api/data-access/admin-api-client'
import { getApiClient } from '../api/data-access/get-api-client'
import { getOptionalString, pickDefined } from '../api/util/command-options'
import { coreUiJson } from '../core/ui/core-ui-json'
import { usersUiPrintUserList } from './ui/users-ui-print-user-list'

type UsersListOptions = ApiClientOptions & {
  json?: boolean
  search?: string
}

export async function usersFeatureList(options: UsersListOptions) {
  const apiClient = getApiClient(options)
  const input = pickDefined<AdminUserListInput>({
    search: getOptionalString(options.search),
  })
  const result = await apiClient.userList(input ?? {})

  if (options.json) {
    coreUiJson(result)
    return
  }

  usersUiPrintUserList(result)
}

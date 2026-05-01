import { type ApiClientOptions } from '../api/data-access/admin-api-client'
import { getApiClient } from '../api/data-access/get-api-client'
import { getOptionalString, pickDefined } from '../api/util/command-options'
import { coreUiJson } from '../core/ui/core-ui-json'
import { usersUiPrintUser } from './ui/users-ui-print-user'

type UsersLinkSolanaOptions = ApiClientOptions & {
  address: string
  json?: boolean
  name?: string
  primary?: boolean
}

export async function usersFeatureLinkSolana(userId: string, options: UsersLinkSolanaOptions) {
  const apiClient = getApiClient(options)
  const user = await apiClient.userLinkSolanaWallet({
    address: options.address,
    userId,
    ...pickDefined({
      isPrimary: options.primary,
      name: getOptionalString(options.name),
    }),
  })

  if (options.json) {
    coreUiJson(user)
    return
  }

  usersUiPrintUser(user)
}

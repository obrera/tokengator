import { type ApiClientOptions } from '../api/data-access/admin-api-client'
import { getApiClient } from '../api/data-access/get-api-client'
import { getOptionalString, pickDefined } from '../api/util/command-options'
import { coreUiJson } from '../core/ui/core-ui-json'
import { usersUiPrintUser } from './ui/users-ui-print-user'

type UsersCreateOptions = ApiClientOptions & {
  email: string
  emailUnverified?: boolean
  image?: string
  json?: boolean
  name: string
  role?: 'admin' | 'user'
  username?: string
}

export async function usersFeatureCreate(options: UsersCreateOptions) {
  const apiClient = getApiClient(options)
  const user = await apiClient.userCreate({
    email: options.email,
    emailVerified: options.emailUnverified ? false : undefined,
    name: options.name,
    ...pickDefined({
      image: getOptionalString(options.image),
      role: options.role,
      username: getOptionalString(options.username),
    }),
  })

  if (options.json) {
    coreUiJson(user)
    return
  }

  usersUiPrintUser(user)
}

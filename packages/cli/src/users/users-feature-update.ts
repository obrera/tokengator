import { type AdminUserUpdateInput, type ApiClientOptions } from '../api/data-access/admin-api-client'
import { getApiClient } from '../api/data-access/get-api-client'
import { getOptionalString, pickDefined } from '../api/util/command-options'
import { coreUiJson } from '../core/ui/core-ui-json'
import { usersUiPrintUser } from './ui/users-ui-print-user'

type UsersUpdateOptions = ApiClientOptions & {
  email?: string
  emailUnverified?: boolean
  emailVerified?: boolean
  image?: string
  json?: boolean
  name?: string
  role?: 'admin' | 'user'
  username?: string
}

function getEmailVerifiedUpdate(options: Pick<UsersUpdateOptions, 'emailUnverified' | 'emailVerified'>) {
  if (options.emailVerified && options.emailUnverified) {
    throw new Error('Use either --email-verified or --email-unverified.')
  }

  if (options.emailVerified) {
    return true
  }

  if (options.emailUnverified) {
    return false
  }

  return undefined
}

export async function usersFeatureUpdate(userId: string, options: UsersUpdateOptions) {
  const apiClient = getApiClient(options)
  const data = pickDefined<AdminUserUpdateInput>({
    email: getOptionalString(options.email),
    emailVerified: getEmailVerifiedUpdate(options),
    image: getOptionalString(options.image),
    name: getOptionalString(options.name),
    role: options.role,
    username: getOptionalString(options.username),
  })
  const user = await apiClient.userUpdate({
    data: data ?? {},
    userId,
  })

  if (options.json) {
    coreUiJson(user)
    return
  }

  usersUiPrintUser(user)
}

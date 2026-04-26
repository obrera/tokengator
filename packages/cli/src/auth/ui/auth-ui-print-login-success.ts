import type { AuthSession } from '../data-access/auth-api-client'

function getUserDisplay(user: AuthSession['user']) {
  return user.username ?? user.name ?? user.email ?? user.id
}

export function authUiPrintLoginSuccess(args: {
  apiKeyId: string
  apiKeyName: string
  apiUrl: string
  profile: string
  user: AuthSession['user']
}) {
  console.log('Logged in to Tokengator.')
  console.log(`Profile: ${args.profile}`)
  console.log(`API URL: ${args.apiUrl}`)
  console.log(`User: ${getUserDisplay(args.user)}`)
  console.log(`API key: ${args.apiKeyName} (${args.apiKeyId})`)
}

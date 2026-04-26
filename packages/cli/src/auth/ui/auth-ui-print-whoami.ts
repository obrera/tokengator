import type { AuthSession } from '../data-access/auth-api-client'

function getOptionalUserFields(user: AuthSession['user']) {
  return [
    ['Username', user.username],
    ['Name', user.name],
    ['Email', user.email],
  ] as const
}

export function authUiPrintWhoami(args: {
  apiKeyName?: string
  apiUrl: string
  profile: string
  user: AuthSession['user']
}) {
  console.log(`Profile: ${args.profile}`)
  console.log(`API URL: ${args.apiUrl}`)
  console.log(`User ID: ${args.user.id}`)

  for (const [label, value] of getOptionalUserFields(args.user)) {
    if (value) {
      console.log(`${label}: ${value}`)
    }
  }

  if (args.apiKeyName) {
    console.log(`API key: ${args.apiKeyName}`)
  }
}

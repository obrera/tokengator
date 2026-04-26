import { siwsClient } from 'better-auth-solana/client'
import { adminClient, deviceAuthorizationClient, organizationClient, usernameClient } from 'better-auth/client/plugins'
import { createAuthClient } from 'better-auth/react'
import { env } from '@tokengator/env/web-server'

export const authClientServer = createAuthClient({
  baseURL: env.API_URL,
  plugins: [adminClient(), deviceAuthorizationClient(), organizationClient(), siwsClient(), usernameClient()],
})

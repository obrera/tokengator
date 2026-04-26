import { createServerFn } from '@tanstack/react-start'
import type { ProfileListApiKeysResult } from '@tokengator/sdk'

import { authMiddleware } from '@/features/auth/data-access/auth-middleware'
import { serverOrpcClient } from '@/lib/orpc-server'

export const getProfileListApiKeys = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .handler(async ({ context }) => {
    if (!context.session) {
      return null
    }

    return (await serverOrpcClient.profile.listApiKeys()) satisfies ProfileListApiKeysResult
  })

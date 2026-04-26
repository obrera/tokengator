import { useMutation } from '@tanstack/react-query'
import { useMemo } from 'react'
import { toast } from 'sonner'

import { getAuthClientClient } from '@/features/auth/data-access/auth-client-client'
import type { CliAuthDeviceClient } from './cli-auth-device-client'
import { getCliAuthDeviceErrorMessage } from './get-cli-auth-device-error-message'

export function useCliAuthDeviceApprove(authClient?: CliAuthDeviceClient) {
  const client = useMemo(() => authClient ?? getAuthClientClient(), [authClient])

  return useMutation({
    mutationFn: async ({ userCode }: { userCode: string }) => {
      const { error } = await client.device.approve({
        userCode,
      })

      if (error) {
        throw new Error(getCliAuthDeviceErrorMessage(error, 'Unable to approve CLI access.'))
      }
    },
    onError: (error) => {
      toast.error(getCliAuthDeviceErrorMessage(error, 'Unable to approve CLI access.'))
    },
  })
}

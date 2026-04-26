import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { getAuthClientClient } from '@/features/auth/data-access/auth-client-client'
import type { CliAuthDeviceClient } from './cli-auth-device-client'
import { getCliAuthDeviceErrorMessage } from './get-cli-auth-device-error-message'

export function useCliAuthDeviceDeny(authClient?: CliAuthDeviceClient) {
  return useMutation({
    mutationFn: async ({ userCode }: { userCode: string }) => {
      const client = authClient ?? getAuthClientClient()
      const { error } = await client.device.deny({
        userCode,
      })

      if (error) {
        throw new Error(getCliAuthDeviceErrorMessage(error, 'Unable to deny CLI access.'))
      }
    },
    onError: (error) => {
      toast.error(getCliAuthDeviceErrorMessage(error, 'Unable to deny CLI access.'))
    },
  })
}

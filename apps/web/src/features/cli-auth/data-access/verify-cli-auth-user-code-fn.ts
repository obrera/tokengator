import { createServerFn } from '@tanstack/react-start'
import z from 'zod'

import { authClientServer } from '@/features/auth/data-access/auth-client-server'
import { authMiddleware } from '@/features/auth/data-access/auth-middleware'

import { normalizeCliAuthUserCode } from '../util/cli-auth-user-code'

export type CliAuthUserCodeVerificationState = 'invalid' | 'ready'

export interface CliAuthUserCodeVerification {
  error: string | null
  state: CliAuthUserCodeVerificationState
}

export const validCliAuthUserCodeVerification = {
  error: null,
  state: 'ready',
} satisfies CliAuthUserCodeVerification

const cliAuthUserCodeVerificationInputSchema = z.object({
  userCode: z
    .string()
    .transform((value) => normalizeCliAuthUserCode(value))
    .pipe(z.string().min(1)),
})

function getDeviceAuthErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object') {
    const message = 'message' in error ? error.message : undefined

    if (typeof message === 'string' && message.trim()) {
      return message
    }
  }

  return fallback
}

export const verifyCliAuthUserCode = createServerFn({ method: 'GET' })
  .middleware([authMiddleware])
  .inputValidator((input: { userCode: string }) => cliAuthUserCodeVerificationInputSchema.parse(input))
  .handler(async ({ context, data }): Promise<CliAuthUserCodeVerification> => {
    if (!context.session) {
      return {
        error: 'Sign in to authorize the CLI.',
        state: 'invalid',
      }
    }

    try {
      const { error } = await authClientServer.device({
        query: {
          user_code: data.userCode,
        },
      })

      if (error) {
        return {
          error: getDeviceAuthErrorMessage(error, 'Invalid or expired CLI authorization code.'),
          state: 'invalid',
        }
      }

      return validCliAuthUserCodeVerification
    } catch (error) {
      return {
        error: getDeviceAuthErrorMessage(error, 'Unable to verify the CLI authorization code.'),
        state: 'invalid',
      }
    }
  })

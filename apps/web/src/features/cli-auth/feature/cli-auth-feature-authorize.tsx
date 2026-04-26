import type { AppSessionUser } from '@/features/auth/data-access/get-app-auth-state'

import type { CliAuthDeviceClient } from '../data-access/cli-auth-device-client'
import type { CliAuthUserCodeVerification } from '../data-access/verify-cli-auth-user-code-fn'
import { validCliAuthUserCodeVerification } from '../data-access/verify-cli-auth-user-code-fn'
import { normalizeCliAuthUserCode } from '../util/cli-auth-user-code'
import { CliAuthFeatureDeviceRequest } from './cli-auth-feature-device-request'
import { CliAuthFeatureManualCodeEntry } from './cli-auth-feature-manual-code-entry'

export function CliAuthFeatureAuthorize({
  authClient,
  initialUserCode,
  user,
  userCodeVerification = validCliAuthUserCodeVerification,
}: {
  authClient?: CliAuthDeviceClient
  initialUserCode?: string
  user: AppSessionUser
  userCodeVerification?: CliAuthUserCodeVerification
}) {
  const userCode = normalizeCliAuthUserCode(initialUserCode)

  if (!userCode) {
    return <CliAuthFeatureManualCodeEntry initialUserCode={initialUserCode} />
  }

  return (
    <CliAuthFeatureDeviceRequest
      authClient={authClient}
      user={user}
      userCode={userCode}
      userCodeVerification={userCodeVerification}
    />
  )
}

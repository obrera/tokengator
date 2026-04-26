import { createFileRoute, redirect } from '@tanstack/react-router'

import { getAppAuthStateQueryOptions } from '@/features/auth/data-access/get-app-auth-state'
import {
  validCliAuthUserCodeVerification,
  verifyCliAuthUserCode,
} from '@/features/cli-auth/data-access/verify-cli-auth-user-code-fn'
import { CliAuthFeatureAuthorize } from '@/features/cli-auth/feature/cli-auth-feature-authorize'
import { normalizeCliAuthUserCode, validateCliAuthorizeSearch } from '@/features/cli-auth/util/cli-auth-user-code'

export const Route = createFileRoute('/cli/authorize')({
  beforeLoad: async ({ context, location, search }) => {
    const { session } = await context.queryClient.ensureQueryData(getAppAuthStateQueryOptions())

    if (!session) {
      throw redirect({
        search: {
          redirect: location.href,
        },
        to: '/login',
      })
    }

    const userCode = normalizeCliAuthUserCode(search.user_code)
    const userCodeVerification = userCode
      ? await verifyCliAuthUserCode({
          data: {
            userCode,
          },
        })
      : validCliAuthUserCodeVerification

    return {
      session,
      userCode,
      userCodeVerification,
    }
  },
  component: RouteComponent,
  validateSearch: validateCliAuthorizeSearch,
})

function RouteComponent() {
  const { session, userCode, userCodeVerification } = Route.useRouteContext()

  return (
    <CliAuthFeatureAuthorize
      initialUserCode={userCode}
      user={session.user}
      userCodeVerification={userCodeVerification}
    />
  )
}

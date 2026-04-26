import { createFileRoute, redirect } from '@tanstack/react-router'

import { getAppAuthStateQueryOptions } from '@/features/auth/data-access/get-app-auth-state'
import { getProfileListApiKeysRouteQueryOptions } from '@/features/profile/data-access/use-profile-list-api-keys'
import { ProfileFeatureSettings } from '@/features/profile/feature/profile-feature-settings'
import { canAccessProfileSettings } from '@/features/profile/util/profile-route-access'

export const Route = createFileRoute('/profile/$username/settings')({
  beforeLoad: async ({ context, params }) => {
    const { session } = await context.queryClient.ensureQueryData(getAppAuthStateQueryOptions())

    if (!session) {
      throw redirect({
        to: '/login',
      })
    }

    if (!canAccessProfileSettings({ session, username: params.username })) {
      throw redirect({
        params: {
          username: params.username,
        },
        to: '/profile/$username',
      })
    }

    const apiKeys = await context.queryClient.ensureQueryData(getProfileListApiKeysRouteQueryOptions(session.user.id))

    return {
      apiKeys,
    }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { apiKeys } = Route.useRouteContext()

  return <ProfileFeatureSettings initialApiKeys={apiKeys} />
}

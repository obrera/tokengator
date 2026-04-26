import { createFileRoute, redirect } from '@tanstack/react-router'

import { finalizeDiscordAuthState } from '@/features/auth/data-access/finalize-discord-auth'
import { AuthFeatureCallbackPending } from '@/features/auth/feature/auth-feature-callback-pending'
import { validateAuthLocalRedirectSearch } from '@/features/auth/util/auth-local-redirect'

export const Route = createFileRoute('/auth-callback')({
  beforeLoad: async ({ context, search }) => {
    const appAuthState = await finalizeDiscordAuthState(context.queryClient)

    if (appAuthState.session && search.redirect) {
      throw redirect({ href: search.redirect })
    }

    if (!appAuthState.session) {
      throw redirect({
        search: search.redirect
          ? {
              redirect: search.redirect,
            }
          : undefined,
        to: '/login',
      })
    }

    throw redirect({ to: appAuthState.authenticatedHomePath })
  },
  component: RoutePendingComponent,
  pendingComponent: RoutePendingComponent,
  pendingMs: 0,
  validateSearch: validateAuthLocalRedirectSearch,
})

function RoutePendingComponent() {
  return <AuthFeatureCallbackPending />
}

import { createFileRoute, redirect } from '@tanstack/react-router'

import { getAppAuthStateQueryOptions } from '@/features/auth/data-access/get-app-auth-state'
import { AuthFeatureSignIn } from '@/features/auth/feature/auth-feature-sign-in'
import { validateAuthLocalRedirectSearch } from '@/features/auth/util/auth-local-redirect'

export const Route = createFileRoute('/login')({
  beforeLoad: async ({ context, search }) => {
    const { authenticatedHomePath, session } = await context.queryClient.ensureQueryData(getAppAuthStateQueryOptions())

    if (!session) {
      return { redirect: search.redirect }
    }

    if (search.redirect) {
      throw redirect({ href: search.redirect })
    }

    throw redirect({ to: authenticatedHomePath })
  },
  component: RouteComponent,
  validateSearch: validateAuthLocalRedirectSearch,
})

function RouteComponent() {
  const { redirect } = Route.useRouteContext()

  return <AuthFeatureSignIn redirect={redirect} />
}

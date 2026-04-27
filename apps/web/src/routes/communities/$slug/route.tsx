import { Outlet, createFileRoute } from '@tanstack/react-router'

import { getCommunityBySlugRouteQueryOptions } from '@/features/community/data-access/use-community-by-slug-query'
import { getCommunityListRouteQueryOptions } from '@/features/community/data-access/use-community-list-query'
import { CommunityFeatureShell } from '@/features/community/feature/community-feature-shell'

export const Route = createFileRoute('/communities/$slug')({
  beforeLoad: async ({ context, params }) => {
    const [communities, community] = await Promise.all([
      context.queryClient.ensureQueryData(getCommunityListRouteQueryOptions()),
      context.queryClient.ensureQueryData(getCommunityBySlugRouteQueryOptions(params.slug)),
    ])

    return { communities, community }
  },
  component: RouteComponent,
})

function RouteComponent() {
  const { communities, community, session } = Route.useRouteContext()

  return (
    <CommunityFeatureShell
      initialCommunities={communities}
      initialCommunity={community}
      isAdmin={session.user.role === 'admin'}
    >
      <Outlet />
    </CommunityFeatureShell>
  )
}

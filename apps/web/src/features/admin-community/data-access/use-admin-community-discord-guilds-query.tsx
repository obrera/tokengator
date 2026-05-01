import { useQuery } from '@tanstack/react-query'

import { orpc } from '@/lib/orpc'

export function useAdminCommunityDiscordGuildsQuery(organizationId: string, enabled: boolean) {
  return useQuery(
    orpc.adminOrganization.listDiscordGuilds.queryOptions({
      enabled: Boolean(organizationId) && enabled,
      input: {
        organizationId,
      },
    }),
  )
}

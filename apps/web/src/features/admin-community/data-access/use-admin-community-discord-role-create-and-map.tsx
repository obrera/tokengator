import { useMutation } from '@tanstack/react-query'
import { toast } from 'sonner'

import { orpc } from '@/lib/orpc'
import { useAdminCommunityDiscordInvalidation } from './use-admin-community-discord-invalidation'
import { useAdminCommunityRoleInvalidation } from './use-admin-community-role-invalidation'

export function useAdminCommunityDiscordRoleCreateAndMap(organizationId: string) {
  const discord = useAdminCommunityDiscordInvalidation()
  const role = useAdminCommunityRoleInvalidation()

  return useMutation(
    orpc.adminCommunityRole.createDiscordRoleMapping.mutationOptions({
      onError: (error) => {
        toast.error(error.message)
      },
      onSuccess: async (result) => {
        await Promise.all([discord.invalidateGuildRoles(organizationId), role.invalidateRoleCatalog(organizationId)])
        toast.success(
          result.created
            ? `Discord role "${result.discordRoleName}" created and mapped.`
            : `Discord role "${result.discordRoleName}" mapped.`,
        )
      },
    }),
  )
}

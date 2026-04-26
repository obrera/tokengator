import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { toast } from 'sonner'

import { orpc } from '@/lib/orpc'

import { getProfileListApiKeysQueryKey } from './use-profile-list-api-keys'

function decrementCount(counts: Record<string, number>, id: string) {
  const nextCount = (counts[id] ?? 0) - 1
  const nextCounts = { ...counts }

  if (nextCount > 0) {
    nextCounts[id] = nextCount
  } else {
    delete nextCounts[id]
  }

  return nextCounts
}

function incrementCount(counts: Record<string, number>, id: string) {
  return {
    ...counts,
    [id]: (counts[id] ?? 0) + 1,
  }
}

export function useProfileRevokeApiKey(userId: string) {
  const queryClient = useQueryClient()
  const [revokingApiKeyCounts, setRevokingApiKeyCounts] = useState<Record<string, number>>({})
  const mutation = useMutation(
    orpc.profile.revokeApiKey.mutationOptions({
      onError: (error) => {
        toast.error(error.message)
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries({
          queryKey: getProfileListApiKeysQueryKey(userId),
        })
        toast.success('API key revoked.')
      },
    }),
  )

  async function revokeApiKey(id: string) {
    setRevokingApiKeyCounts((counts) => incrementCount(counts, id))

    try {
      await mutation.mutateAsync({ id })

      return true
    } catch {
      return false
    } finally {
      setRevokingApiKeyCounts((counts) => decrementCount(counts, id))
    }
  }

  return {
    revokeApiKey,
    revokingApiKeyCounts,
  }
}

import { queryOptions, useQuery } from '@tanstack/react-query'

import { orpc } from '@/lib/orpc'

export function getProfileListApiKeysQueryKey(userId: string) {
  return [...orpc.profile.listApiKeys.key(), userId] as const
}

export function getProfileListApiKeysQueryOptions(userId: string) {
  return queryOptions({
    ...orpc.profile.listApiKeys.queryOptions(),
    queryKey: getProfileListApiKeysQueryKey(userId),
    staleTime: 30_000,
  })
}

export function useProfileListApiKeys(userId: string) {
  return useQuery({
    ...getProfileListApiKeysQueryOptions(userId),
    enabled: Boolean(userId),
  })
}

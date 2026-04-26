import { queryOptions, useQuery } from '@tanstack/react-query'
import type { ProfileListApiKeysResult } from '@tokengator/sdk'

import { orpc } from '@/lib/orpc'

import { getProfileListApiKeys } from './get-profile-list-api-keys-fn'

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

export function getProfileListApiKeysRouteQueryOptions(userId: string) {
  return queryOptions({
    enabled: Boolean(userId),
    queryFn: () => getProfileListApiKeys(),
    queryKey: getProfileListApiKeysQueryKey(userId),
    staleTime: 30_000,
  })
}

export function useProfileListApiKeys(
  userId: string,
  options?: {
    initialData?: ProfileListApiKeysResult
  },
) {
  return useQuery({
    ...getProfileListApiKeysQueryOptions(userId),
    enabled: Boolean(userId),
    initialData: options?.initialData,
  })
}

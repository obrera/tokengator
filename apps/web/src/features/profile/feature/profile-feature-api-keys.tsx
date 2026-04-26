import type { ProfileListApiKeysResult } from '@tokengator/sdk'

import { useProfileListApiKeys } from '../data-access/use-profile-list-api-keys'
import { useProfileRevokeApiKey } from '../data-access/use-profile-revoke-api-key'
import { ProfileUiApiKeyCard } from '../ui/profile-ui-api-key-card'

export function ProfileFeatureApiKeys({
  initialApiKeys,
  userId,
}: {
  initialApiKeys?: ProfileListApiKeysResult | null
  userId: string
}) {
  const apiKeys = useProfileListApiKeys(userId, {
    initialData: initialApiKeys ?? undefined,
  })
  const revokeApiKey = useProfileRevokeApiKey(userId)

  return (
    <ProfileUiApiKeyCard
      apiKeys={apiKeys.data?.apiKeys ?? []}
      onRevokeApiKey={revokeApiKey.revokeApiKey}
      revokingApiKeyCounts={revokeApiKey.revokingApiKeyCounts}
    />
  )
}

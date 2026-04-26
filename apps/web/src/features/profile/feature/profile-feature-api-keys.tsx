import { useProfileListApiKeys } from '../data-access/use-profile-list-api-keys'
import { useProfileRevokeApiKey } from '../data-access/use-profile-revoke-api-key'
import { ProfileUiApiKeyCard } from '../ui/profile-ui-api-key-card'

export function ProfileFeatureApiKeys({ userId }: { userId: string }) {
  const apiKeys = useProfileListApiKeys(userId)
  const revokeApiKey = useProfileRevokeApiKey(userId)

  return (
    <ProfileUiApiKeyCard
      apiKeys={apiKeys.data?.apiKeys ?? []}
      isPending={apiKeys.isPending}
      onRevokeApiKey={revokeApiKey.revokeApiKey}
      revokingApiKeyCounts={revokeApiKey.revokingApiKeyCounts}
    />
  )
}

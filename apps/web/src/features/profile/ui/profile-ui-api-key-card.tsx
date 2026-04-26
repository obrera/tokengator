import { MoreHorizontal, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { ProfileApiKeyEntity } from '@tokengator/sdk'
import { Badge } from '@tokengator/ui/components/badge'
import { Button } from '@tokengator/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tokengator/ui/components/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@tokengator/ui/components/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@tokengator/ui/components/dropdown-menu'
import { UiListCard, UiListCardHeader, UiListCardMeta } from '@tokengator/ui/components/ui-list-card'
import { formatDateTime } from '@tokengator/ui/util/format-date-time'

function getApiKeyIdentifier(apiKey: ProfileApiKeyEntity) {
  return apiKey.start ?? apiKey.prefix ?? apiKey.id
}

function getApiKeyName(apiKey: ProfileApiKeyEntity) {
  return apiKey.name ?? 'Unnamed API key'
}

function ProfileUiApiKeyRow({
  apiKey,
  isRevoking,
  onRevokeApiKey,
}: {
  apiKey: ProfileApiKeyEntity
  isRevoking: boolean
  onRevokeApiKey: (id: string) => Promise<boolean>
}) {
  const [isRevokeOpen, setIsRevokeOpen] = useState(false)
  const apiKeyName = getApiKeyName(apiKey)
  const statusLabel = isRevoking ? 'Revoking' : apiKey.enabled ? 'Enabled' : 'Disabled'

  async function handleRevokeApiKey() {
    const didRevoke = await onRevokeApiKey(apiKey.id)

    if (didRevoke) {
      setIsRevokeOpen(false)
    }
  }

  return (
    <UiListCard>
      <UiListCardHeader className="items-start">
        <div className="grid min-w-0 gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate font-medium">{apiKeyName}</p>
            <Badge variant={apiKey.enabled && !isRevoking ? 'secondary' : 'outline'}>{statusLabel}</Badge>
          </div>
          <p className="text-muted-foreground font-mono text-xs">{getApiKeyIdentifier(apiKey)}</p>
        </div>
        <UiListCardMeta>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button aria-label="Open API key actions" size="icon-sm" variant="ghost" />}>
              <MoreHorizontal />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem disabled={isRevoking} onClick={() => setIsRevokeOpen(true)} variant="destructive">
                <Trash2 />
                {isRevoking ? 'Revoking...' : 'Revoke'}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </UiListCardMeta>
      </UiListCardHeader>

      <dl className="grid gap-2 text-xs sm:grid-cols-2">
        <div>
          <dt className="text-muted-foreground">Created</dt>
          <dd>{formatDateTime(apiKey.createdAt)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Expires</dt>
          <dd>{formatDateTime(apiKey.expiresAt)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Last used</dt>
          <dd>{formatDateTime(apiKey.lastRequest)}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Requests</dt>
          <dd>{apiKey.requestCount.toLocaleString()}</dd>
        </div>
      </dl>

      <Dialog onOpenChange={setIsRevokeOpen} open={isRevokeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Revoke API Key</DialogTitle>
            <DialogDescription>
              Revoke {apiKeyName}. Clients using this key will no longer be able to access the API.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="border-t pt-3">
            <Button onClick={() => setIsRevokeOpen(false)} type="button" variant="outline">
              Cancel
            </Button>
            <Button disabled={isRevoking} onClick={() => void handleRevokeApiKey()} type="button" variant="destructive">
              {isRevoking ? 'Revoking...' : 'Revoke'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </UiListCard>
  )
}

export function ProfileUiApiKeyCard({
  apiKeys,
  onRevokeApiKey,
  revokingApiKeyCounts,
}: {
  apiKeys: ProfileApiKeyEntity[]
  onRevokeApiKey: (id: string) => Promise<boolean>
  revokingApiKeyCounts: Record<string, number>
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>API Keys</CardTitle>
        <CardDescription>Manage API keys created for command line access.</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm">
        {apiKeys.length === 0 ? <p className="text-muted-foreground">No API keys yet.</p> : null}
        {apiKeys.map((apiKey) => (
          <ProfileUiApiKeyRow
            apiKey={apiKey}
            isRevoking={Boolean(revokingApiKeyCounts[apiKey.id])}
            key={apiKey.id}
            onRevokeApiKey={onRevokeApiKey}
          />
        ))}
      </CardContent>
    </Card>
  )
}

import { Download, Loader2, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import type {
  DevPubkeyLinkImportApplyResult,
  DevPubkeyLinkImportPreviewResult,
  DevPubkeyLinkImportUserEntity,
} from '@tokengator/sdk'
import { Badge } from '@tokengator/ui/components/badge'
import { Button } from '@tokengator/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tokengator/ui/components/card'
import { Input } from '@tokengator/ui/components/input'
import { Label } from '@tokengator/ui/components/label'
import { UiDebug } from '@tokengator/ui/components/ui-debug'
import { UiInfoCard, UiInfoCardLabel, UiInfoCardValue } from '@tokengator/ui/components/ui-info-card'
import {
  UiTable,
  UiTableBody,
  UiTableCell,
  UiTableHead,
  UiTableHeaderCell,
  UiTableRow,
} from '@tokengator/ui/components/ui-table'

import { useDevPubkeyLinkImportApply } from '../data-access/use-dev-pubkey-link-import-apply'
import { useDevPubkeyLinkImportPreview } from '../data-access/use-dev-pubkey-link-import-preview'

type DevPubkeyLinkImportResult = DevPubkeyLinkImportApplyResult | DevPubkeyLinkImportPreviewResult

function formatMatchKinds(user: DevPubkeyLinkImportUserEntity) {
  return user.matches
    .map((match) => `${match.username ? `@${match.username}` : match.id} (${match.kinds.join(', ')})`)
    .join(', ')
}

function getStatusCopy(result: DevPubkeyLinkImportResult | null) {
  if (!result) {
    return null
  }

  if (result.kind === 'apply') {
    return result.summary.skipUserCount > 0 ? 'Apply completed with skips' : 'Apply completed'
  }

  return 'Preview ready'
}

export function DevFeatureBackup() {
  const applyImport = useDevPubkeyLinkImportApply()
  const previewImport = useDevPubkeyLinkImportPreview()
  const [lastAction, setLastAction] = useState<'apply' | 'preview' | null>(null)
  const [sourceUrl, setSourceUrl] = useState('')
  const activeError = lastAction === 'apply' ? applyImport.error : lastAction === 'preview' ? previewImport.error : null
  const errorMessage = activeError?.message ?? null
  const isApplyPending = applyImport.isPending
  const isPreviewPending = previewImport.isPending
  const trimmedSourceUrl = sourceUrl.trim()
  const canSubmit = trimmedSourceUrl.length > 0
  const canPreview = canSubmit && !isApplyPending && !isPreviewPending
  const canApply =
    canSubmit &&
    previewImport.data?.backup.sourceUrl === trimmedSourceUrl &&
    previewImport.error === null &&
    !isApplyPending &&
    !isPreviewPending
  const result: DevPubkeyLinkImportResult | null = (() => {
    if (lastAction === 'apply') {
      return applyImport.data ?? null
    }

    if (lastAction === 'preview') {
      return previewImport.data ?? null
    }

    return applyImport.data ?? previewImport.data ?? null
  })()
  const skippedUsers = (result?.users ?? [])
    .filter((user) => user.action === 'skip')
    .sort((left, right) => left.source.username.localeCompare(right.source.username))
  const usernameRewrites = (result?.usernameRewrites ?? [])
    .slice()
    .sort((left, right) => left.originalUsername.localeCompare(right.originalUsername))
  const statusCopy = getStatusCopy(result)

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-3">
          <CardTitle>Pubkey-Link Import</CardTitle>
          {statusCopy ? <Badge variant={result?.kind === 'apply' ? 'secondary' : 'outline'}>{statusCopy}</Badge> : null}
        </div>
        <CardDescription>
          Fetch a pubkey-link backup from a remote URL, preview the TokenGator account changes, and optionally apply
          them.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault()

            if (!canPreview) {
              return
            }

            setLastAction('preview')
            previewImport.mutate({
              sourceUrl: trimmedSourceUrl,
            })
          }}
        >
          <div className="grid gap-2">
            <Label htmlFor="dev-backup-source-url">Backup URL</Label>
            <Input
              id="dev-backup-source-url"
              onChange={(event) => setSourceUrl(event.target.value)}
              placeholder="https://example.com/api/backup/download?name=...&secret=..."
              type="url"
              value={sourceUrl}
            />
          </div>
          <div className="flex flex-wrap gap-3">
            <Button disabled={!canPreview} type="submit" variant="outline">
              {isPreviewPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              Preview Import
            </Button>
            <Button
              disabled={!canApply}
              onClick={() => {
                if (!canApply) {
                  return
                }

                setLastAction('apply')
                applyImport.mutate({
                  sourceUrl: trimmedSourceUrl,
                })
              }}
              type="button"
            >
              {isApplyPending ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
              Apply Import
            </Button>
          </div>
        </form>

        {errorMessage ? <div className="text-destructive text-sm">{errorMessage}</div> : null}

        {result ? (
          <>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <UiInfoCard>
                <UiInfoCardLabel>Backup</UiInfoCardLabel>
                <UiInfoCardValue>{result.backup.backupName ?? 'Untitled'}</UiInfoCardValue>
                <div className="text-muted-foreground mt-1 text-xs">{result.backup.sourceUsersCount} source users</div>
              </UiInfoCard>
              <UiInfoCard>
                <UiInfoCardLabel>Users</UiInfoCardLabel>
                <div className="mt-1 flex items-baseline justify-between gap-3">
                  <UiInfoCardLabel>Create</UiInfoCardLabel>
                  <UiInfoCardValue>{result.summary.createUserCount}</UiInfoCardValue>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <UiInfoCardLabel>Merge</UiInfoCardLabel>
                  <UiInfoCardValue>{result.summary.mergeUserCount}</UiInfoCardValue>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <UiInfoCardLabel>Unchanged</UiInfoCardLabel>
                  <UiInfoCardValue>{result.summary.unchangedUserCount}</UiInfoCardValue>
                </div>
              </UiInfoCard>
              <UiInfoCard>
                <UiInfoCardLabel>Inserted Rows</UiInfoCardLabel>
                <div className="mt-1 flex items-baseline justify-between gap-3">
                  <UiInfoCardLabel>Accounts</UiInfoCardLabel>
                  <UiInfoCardValue>{result.summary.createDiscordAccountCount}</UiInfoCardValue>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <UiInfoCardLabel>Identities</UiInfoCardLabel>
                  <UiInfoCardValue>{result.summary.createIdentityCount}</UiInfoCardValue>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <UiInfoCardLabel>Wallets</UiInfoCardLabel>
                  <UiInfoCardValue>{result.summary.createSolanaWalletCount}</UiInfoCardValue>
                </div>
              </UiInfoCard>
              <UiInfoCard>
                <UiInfoCardLabel>Skips</UiInfoCardLabel>
                <div className="mt-1 flex items-baseline justify-between gap-3">
                  <UiInfoCardLabel>Total</UiInfoCardLabel>
                  <UiInfoCardValue>{result.summary.skipUserCount}</UiInfoCardValue>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <UiInfoCardLabel>Conflict</UiInfoCardLabel>
                  <UiInfoCardValue>{result.summary.skipConflictCount}</UiInfoCardValue>
                </div>
                <div className="flex items-baseline justify-between gap-3">
                  <UiInfoCardLabel>No Discord</UiInfoCardLabel>
                  <UiInfoCardValue>{result.summary.skipMissingDiscordCount}</UiInfoCardValue>
                </div>
              </UiInfoCard>
            </div>

            {result.kind === 'apply' ? (
              <div className="rounded-md border p-3 text-sm">
                <div className="font-medium">Applied changes</div>
                <div className="text-muted-foreground mt-1">
                  {result.appliedSummary.appliedUserCount} users touched, {result.appliedSummary.createUserCount} users
                  created, {result.appliedSummary.createDiscordAccountCount} Discord accounts inserted,{' '}
                  {result.appliedSummary.createSolanaWalletCount} Solana wallets inserted.
                </div>
              </div>
            ) : null}

            {skippedUsers.length > 0 ? (
              <div className="grid gap-2">
                <div className="font-medium">Skipped and Conflicts</div>
                <UiTable containerClassName="rounded-md">
                  <UiTableHead>
                    <UiTableRow>
                      <UiTableHeaderCell>User</UiTableHeaderCell>
                      <UiTableHeaderCell>Reason</UiTableHeaderCell>
                      <UiTableHeaderCell>Matches</UiTableHeaderCell>
                    </UiTableRow>
                  </UiTableHead>
                  <UiTableBody>
                    {skippedUsers.map((user) => (
                      <UiTableRow key={user.source.backupUserId}>
                        <UiTableCell>@{user.source.username}</UiTableCell>
                        <UiTableCell>{user.skipReason ?? 'skip'}</UiTableCell>
                        <UiTableCell>{user.matches.length > 0 ? formatMatchKinds(user) : 'None'}</UiTableCell>
                      </UiTableRow>
                    ))}
                  </UiTableBody>
                </UiTable>
              </div>
            ) : null}

            {usernameRewrites.length > 0 ? (
              <div className="grid gap-2">
                <div className="font-medium">Username Rewrites</div>
                <UiTable containerClassName="rounded-md">
                  <UiTableHead>
                    <UiTableRow>
                      <UiTableHeaderCell>Source</UiTableHeaderCell>
                      <UiTableHeaderCell>Final</UiTableHeaderCell>
                      <UiTableHeaderCell>Reason</UiTableHeaderCell>
                    </UiTableRow>
                  </UiTableHead>
                  <UiTableBody>
                    {usernameRewrites.map((usernameRewrite) => (
                      <UiTableRow key={usernameRewrite.backupUserId}>
                        <UiTableCell>@{usernameRewrite.originalUsername}</UiTableCell>
                        <UiTableCell>@{usernameRewrite.finalUsername}</UiTableCell>
                        <UiTableCell>{usernameRewrite.reason}</UiTableCell>
                      </UiTableRow>
                    ))}
                  </UiTableBody>
                </UiTable>
              </div>
            ) : null}

            <UiDebug className="bg-muted/50 rounded-md p-3" data={result} />
          </>
        ) : (
          <div className="text-muted-foreground text-sm">
            Paste a remote pubkey-link backup URL and run a preview to inspect the migration plan before applying it.
          </div>
        )}
      </CardContent>
    </Card>
  )
}

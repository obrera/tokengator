export type DevPubkeyLinkImportAction = 'create' | 'merge' | 'skip' | 'unchanged'
export type DevPubkeyLinkImportMatchKind = 'discord' | 'email' | 'solana'
export type DevPubkeyLinkImportSkipReason = 'conflict' | 'email_conflict' | 'missing_discord_identity'
export type DevPubkeyLinkImportUsernameRewriteReason = 'collision' | 'fallback'

export type DevPubkeyLinkImportMatchEntity = {
  id: string
  kinds: DevPubkeyLinkImportMatchKind[]
  username: string | null
}

export type DevPubkeyLinkImportUserEntity = {
  action: DevPubkeyLinkImportAction
  existingUser: {
    id: string
    username: string | null
  } | null
  matches: DevPubkeyLinkImportMatchEntity[]
  operations: {
    createDiscordAccountCount: number
    createDiscordAccountIds: string[]
    createIdentityCount: number
    createSolanaWalletAddresses: string[]
    createSolanaWalletCount: number
    createUser: boolean
  }
  skipReason: DevPubkeyLinkImportSkipReason | null
  source: {
    avatarUrl: string | null
    backupUserId: string
    createdAt: string | null
    discordAccountIds: string[]
    name: string | null
    solanaAddresses: string[]
    updatedAt: string | null
    username: string
  }
  usernameRewrite: {
    backupUserId: string
    finalUsername: string
    originalUsername: string
    reason: DevPubkeyLinkImportUsernameRewriteReason
  } | null
}

export type DevPubkeyLinkImportUsernameRewriteEntity = {
  backupUserId: string
  finalUsername: string
  originalUsername: string
  reason: DevPubkeyLinkImportUsernameRewriteReason
}

export type DevPubkeyLinkImportSummaryEntity = {
  createDiscordAccountCount: number
  createIdentityCount: number
  createSolanaWalletCount: number
  createUserCount: number
  mergeUserCount: number
  skipConflictCount: number
  skipEmailConflictCount: number
  skipMissingDiscordCount: number
  skipUserCount: number
  totalUserCount: number
  unchangedUserCount: number
  usernameRewriteCount: number
}

export type DevPubkeyLinkImportBackupEntity = {
  backupName: string | null
  fetchedAt: string
  sourceUrl: string
  sourceUsersCount: number
  timestamp: string | null
}

export type DevPubkeyLinkImportPreviewResult = {
  backup: DevPubkeyLinkImportBackupEntity
  kind: 'preview'
  summary: DevPubkeyLinkImportSummaryEntity
  usernameRewrites: DevPubkeyLinkImportUsernameRewriteEntity[]
  users: DevPubkeyLinkImportUserEntity[]
}

export type DevPubkeyLinkImportApplyResult = {
  appliedAt: string
  appliedSummary: {
    appliedUserCount: number
    createDiscordAccountCount: number
    createIdentityCount: number
    createSolanaWalletCount: number
    createUserCount: number
  }
  backup: DevPubkeyLinkImportBackupEntity
  kind: 'apply'
  summary: DevPubkeyLinkImportSummaryEntity
  usernameRewrites: DevPubkeyLinkImportUsernameRewriteEntity[]
  users: DevPubkeyLinkImportUserEntity[]
}

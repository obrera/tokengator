import z from 'zod'

import { adminUserLinkSolanaWalletInputSchema } from './admin-user-link-solana-wallet-input-schema'

export type AdminUserLinkSolanaWalletInput = z.infer<typeof adminUserLinkSolanaWalletInputSchema>

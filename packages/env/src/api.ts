import 'dotenv/config'
import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

import { logDebugCategoriesSchema } from './lib/log-debug-categories'
import { createEnvBooleanSchema } from './lib/server-env-boolean'
import { createEnvStringListSchema, parseEnvStringList } from './lib/server-env-list'
import { createEnvPortSchema } from './lib/server-env-port'

function createPositiveIntegerSchema(defaultValue: number) {
  return z.coerce.number().int().positive().default(defaultValue)
}

export const env = createEnv({
  emptyStringAsUndefined: true,
  runtimeEnv: {
    ...process.env,
    API_PORT: process.env.API_PORT ?? process.env.PORT,
  },
  server: {
    API_PORT: createEnvPortSchema(3000),
    API_URL: z.url(),
    BETTER_AUTH_SECRET: z.string().min(32),
    BETTER_AUTH_SOLANA_SIGN_IN_ENABLED: createEnvBooleanSchema(),
    CORS_ORIGINS: z.string().transform(parseEnvStringList).pipe(z.array(z.url()).min(1)),
    DATABASE_AUTH_TOKEN: z.string().min(1).optional(),
    DATABASE_URL: z.string().min(1),
    DISCORD_ADMIN_IDS: createEnvStringListSchema(),
    DISCORD_BOT_START: createEnvBooleanSchema(),
    DISCORD_BOT_TOKEN: z.string().min(1).optional(),
    DISCORD_CLIENT_ID: z.string().min(1),
    DISCORD_CLIENT_SECRET: z.string().min(1),
    DISCORD_GUILD_ID: z.string().min(1).optional(),
    HELIUS_API_KEY: z.string().min(1),
    HELIUS_CLUSTER: z.enum(['devnet', 'mainnet']),
    LOG_DEBUG_CATEGORIES: logDebugCategoriesSchema,
    LOG_JSON: createEnvBooleanSchema(),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    SCHEDULED_DISCORD_SYNC_INTERVAL_MINUTES: createPositiveIntegerSchema(1),
    SCHEDULED_INDEX_INTERVAL_MINUTES: createPositiveIntegerSchema(30),
    SCHEDULED_MEMBERSHIP_SYNC_INTERVAL_MINUTES: createPositiveIntegerSchema(5),
    SCHEDULER_POLL_SECONDS: createPositiveIntegerSchema(60),
    SCHEDULER_START: createEnvBooleanSchema(),
    SOLANA_ADMIN_ADDRESSES: createEnvStringListSchema(),
    SOLANA_CLUSTER: z.enum(['devnet', 'localnet', 'mainnet', 'testnet']),
    SOLANA_ENDPOINT_PUBLIC: z.url(),
    WEB_URL: z.url().optional(),
  },
})

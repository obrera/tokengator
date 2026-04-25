import { createEnv } from '@t3-oss/env-core'
import { z } from 'zod'

const runtimeEnv = {
  API_URL: process.env.API_URL,
  VITE_SERVER_ALLOWED_HOSTS: process.env.VITE_SERVER_ALLOWED_HOSTS,
  VITE_SERVER_HOST: process.env.VITE_SERVER_HOST,
  VITE_SERVER_PORT: process.env.VITE_SERVER_PORT,
} as const

export const env = createEnv({
  emptyStringAsUndefined: true,
  runtimeEnv,
  server: {
    API_URL: z.url().default('http://localhost:3000'),
    VITE_SERVER_ALLOWED_HOSTS: z
      .string()
      .optional()
      .transform((value) =>
        value
          ? [
              ...new Set(
                value
                  .split(',')
                  .map((entry) => entry.trim())
                  .filter(Boolean),
              ),
            ].sort((left, right) => left.localeCompare(right))
          : [],
      )
      .pipe(z.array(z.string().min(1))),
    VITE_SERVER_HOST: z
      .string()
      .optional()
      .transform((value) => (value?.trim().toLowerCase() === 'true' ? true : undefined)),
    VITE_SERVER_PORT: z.coerce.number().int().min(1).max(65_535).default(3001),
  },
})

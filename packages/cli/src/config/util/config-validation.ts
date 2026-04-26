import { z } from 'zod'

export class ConfigError extends Error {
  override name = 'ConfigError'
}

const apiUrlSchema = z
  .string()
  .superRefine((apiUrl, context) => {
    const trimmed = apiUrl.trim()

    if (!trimmed) {
      context.addIssue({
        code: 'custom',
        message: 'API URL is required.',
      })

      return
    }

    let parsed: URL

    try {
      parsed = new URL(trimmed)
    } catch {
      context.addIssue({
        code: 'custom',
        message: `Invalid API URL "${apiUrl}".`,
      })

      return
    }

    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      context.addIssue({
        code: 'custom',
        message: 'API URL must use http or https.',
      })
    }
  })
  .transform((apiUrl) => apiUrl.trim())

const profileNameSchema = z
  .string()
  .superRefine((name, context) => {
    const profile = name.trim()

    if (!profile) {
      context.addIssue({
        code: 'custom',
        message: 'Profile name is required.',
      })

      return
    }

    if (!/^[a-z0-9][a-z0-9-]*$/.test(profile)) {
      context.addIssue({
        code: 'custom',
        message: `Invalid profile name "${name}". Use lowercase letters, numbers, and hyphens.`,
      })
    }
  })
  .transform((name) => name.trim())

function parseConfigValue<T>(schema: z.ZodType<T>, value: string): T {
  const result = schema.safeParse(value)

  if (!result.success) {
    throw new ConfigError(result.error.issues[0]?.message ?? 'Invalid config value.')
  }

  return result.data
}

export function validateApiUrl(apiUrl: string): string {
  return parseConfigValue(apiUrlSchema, apiUrl)
}

export function validateProfileName(name: string): string {
  return parseConfigValue(profileNameSchema, name)
}

import { z } from 'zod'

export function createEnvBooleanSchema(defaultValue = true) {
  return z
    .string()
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return defaultValue
      }

      const normalizedValue = value.trim().toLowerCase()

      return !['0', 'false', 'no', 'off'].includes(normalizedValue)
    })
    .pipe(z.boolean())
}

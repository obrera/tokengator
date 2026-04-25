import { z } from 'zod'

export function parseEnvStringList(value?: string) {
  if (!value) {
    return []
  }

  return [
    ...new Set(
      value
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean),
    ),
  ].sort((left, right) => left.localeCompare(right))
}

export function createEnvStringListSchema() {
  return z
    .string()
    .optional()
    .transform(parseEnvStringList)
    .pipe(z.array(z.string().min(1)))
}

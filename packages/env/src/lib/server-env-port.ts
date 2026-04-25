import { z } from 'zod'

export function createEnvPortSchema(defaultValue: number) {
  return z.coerce.number().int().min(1).max(65_535).default(defaultValue)
}

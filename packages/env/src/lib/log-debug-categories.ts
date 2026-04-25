import { z } from 'zod'
import { APP_DEBUG_CATEGORY_VALUES } from '@tokengator/logger/debug-categories'

import { parseEnvStringList } from './server-env-list'

export const logDebugCategoriesSchema = z
  .string()
  .optional()
  .transform(parseEnvStringList)
  .pipe(z.array(z.enum(APP_DEBUG_CATEGORY_VALUES)))

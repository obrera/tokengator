import { count } from 'drizzle-orm'
import { db } from '@tokengator/db'
import { organization, user } from '@tokengator/db/schema/auth'

export type CoreStatus = {
  configured: boolean
}

let cachedConfiguredStatus: CoreStatus | undefined

export function resetCoreStatusCache() {
  cachedConfiguredStatus = undefined
}

export async function getCoreStatus(): Promise<CoreStatus> {
  if (cachedConfiguredStatus) {
    return cachedConfiguredStatus
  }

  const [[organizationResult], [userResult]] = await Promise.all([
    db
      .select({
        count: count(),
      })
      .from(organization),
    db
      .select({
        count: count(),
      })
      .from(user),
  ])
  const configured = (organizationResult?.count ?? 0) > 0 || (userResult?.count ?? 0) > 0
  const status = {
    configured,
  }

  if (status.configured) {
    cachedConfiguredStatus = status
  }

  return status
}

import { eq } from 'drizzle-orm'
import { db } from '@tokengator/db'
import { user } from '@tokengator/db/schema/auth'

import type { AdminUserCreateInput } from './admin-user-create-input'
import { adminUserGet } from './admin-user-get'

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function normalizeOptionalString(value: string | null | undefined) {
  const trimmedValue = value?.trim()

  return trimmedValue ? trimmedValue : null
}

async function getAmbiguousInsertResult(userId: string) {
  const createdUser = await adminUserGet(userId)

  if (!createdUser) {
    return {
      status: 'user-created-but-not-loaded' as const,
    }
  }

  return {
    status: 'success' as const,
    user: createdUser,
  }
}

export async function adminUserCreate(input: AdminUserCreateInput) {
  const email = normalizeEmail(input.email)
  const username = normalizeOptionalString(input.username)
  const [existingEmail] = await db
    .select({
      id: user.id,
    })
    .from(user)
    .where(eq(user.email, email))
    .limit(1)

  if (existingEmail) {
    return {
      status: 'user-email-taken' as const,
    }
  }

  if (username) {
    const [existingUsername] = await db
      .select({
        id: user.id,
      })
      .from(user)
      .where(eq(user.username, username))
      .limit(1)

    if (existingUsername) {
      return {
        status: 'user-username-taken' as const,
      }
    }
  }

  const userId = crypto.randomUUID()
  const now = new Date()

  try {
    await db.insert(user).values({
      createdAt: now,
      email,
      emailVerified: input.emailVerified ?? true,
      id: userId,
      image: normalizeOptionalString(input.image),
      name: input.name.trim(),
      role: input.role ?? 'user',
      updatedAt: now,
      username,
    })
  } catch (error) {
    const [conflictingEmail] = await db
      .select({
        id: user.id,
      })
      .from(user)
      .where(eq(user.email, email))
      .limit(1)

    if (conflictingEmail?.id === userId) {
      return await getAmbiguousInsertResult(userId)
    }

    if (conflictingEmail) {
      return {
        status: 'user-email-taken' as const,
      }
    }

    if (username) {
      const [conflictingUsername] = await db
        .select({
          id: user.id,
        })
        .from(user)
        .where(eq(user.username, username))
        .limit(1)

      if (conflictingUsername?.id === userId) {
        return await getAmbiguousInsertResult(userId)
      }

      if (conflictingUsername) {
        return {
          status: 'user-username-taken' as const,
        }
      }
    }

    throw error
  }

  const createdUser = await adminUserGet(userId)

  if (!createdUser) {
    return {
      status: 'user-created-but-not-loaded' as const,
    }
  }

  return {
    status: 'success' as const,
    user: createdUser,
  }
}

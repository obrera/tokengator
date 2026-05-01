import { and, eq } from 'drizzle-orm'
import { db } from '@tokengator/db'
import { member, organization, user } from '@tokengator/db/schema/auth'

import type { AdminOrganizationAddMemberInput } from './admin-organization-add-member-input'

export async function adminOrganizationAddMember(input: AdminOrganizationAddMemberInput) {
  const [[existingOrganization], [existingUser]] = await Promise.all([
    db
      .select({
        id: organization.id,
      })
      .from(organization)
      .where(eq(organization.id, input.organizationId))
      .limit(1),
    db
      .select({
        id: user.id,
      })
      .from(user)
      .where(eq(user.id, input.userId))
      .limit(1),
  ])

  if (!existingOrganization) {
    return {
      status: 'organization-not-found' as const,
    }
  }

  if (!existingUser) {
    return {
      status: 'user-not-found' as const,
    }
  }

  const [existingMember] = await db
    .select({
      id: member.id,
    })
    .from(member)
    .where(and(eq(member.organizationId, input.organizationId), eq(member.userId, input.userId)))
    .limit(1)

  if (existingMember) {
    await db.update(member).set({ role: input.role }).where(eq(member.id, existingMember.id))

    return {
      memberId: existingMember.id,
      organizationId: input.organizationId,
      role: input.role,
      status: 'success' as const,
      userId: input.userId,
    }
  }

  const memberId = crypto.randomUUID()

  await db.insert(member).values({
    id: memberId,
    organizationId: input.organizationId,
    role: input.role,
    userId: input.userId,
  })

  return {
    memberId,
    organizationId: input.organizationId,
    role: input.role,
    status: 'success' as const,
    userId: input.userId,
  }
}

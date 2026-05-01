import type { AdminUser } from '../../api/data-access/admin-api-client'
import { coreUiKeyValues } from '../../core/ui/core-ui-key-values'

export function usersUiPrintUser(user: AdminUser) {
  coreUiKeyValues({
    email: user.email,
    id: user.id,
    image: user.image,
    name: user.name,
    role: user.role,
    username: user.username,
  })
}

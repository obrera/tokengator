import type { AdminUserListResult } from '../../api/data-access/admin-api-client'

import { coreUiTable } from '../../core/ui/core-ui-table'

export function usersUiPrintUserList(result: AdminUserListResult) {
  coreUiTable(
    result.users,
    [
      {
        key: 'email',
        label: 'Email',
        value: (user) => user.email,
      },
      {
        key: 'id',
        label: 'ID',
        value: (user) => user.id,
      },
      {
        key: 'name',
        label: 'Name',
        value: (user) => user.name,
      },
      {
        key: 'role',
        label: 'Role',
        value: (user) => user.role,
      },
      {
        key: 'username',
        label: 'Username',
        value: (user) => user.username,
      },
    ],
    'No users found.',
  )
}

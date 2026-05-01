import type { AdminAssetGroupListResult } from '../../api/data-access/admin-api-client'

import { coreUiTable } from '../../core/ui/core-ui-table'

export function assetGroupsUiPrintAssetGroupList(result: AdminAssetGroupListResult) {
  coreUiTable(
    result.assetGroups,
    [
      {
        key: 'address',
        label: 'address',
        value: (assetGroup) => assetGroup.address,
      },
      {
        key: 'enabled',
        label: 'enabled',
        value: (assetGroup) => assetGroup.enabled,
      },
      {
        key: 'id',
        label: 'id',
        value: (assetGroup) => assetGroup.id,
      },
      {
        key: 'label',
        label: 'label',
        value: (assetGroup) => assetGroup.label,
      },
      {
        key: 'resolverKind',
        label: 'resolverKind',
        value: (assetGroup) => assetGroup.resolverKind,
      },
      {
        key: 'type',
        label: 'type',
        value: (assetGroup) => assetGroup.type,
      },
    ],
    'No asset groups found.',
  )
  console.log(`Total: ${result.total}`)
}

import type { AdminAssetGroup } from '../../api/data-access/admin-api-client'
import { coreUiFormatOptionalDate } from '../../core/ui/core-ui-format-optional-date'
import { coreUiKeyValues } from '../../core/ui/core-ui-key-values'

export function assetGroupsUiPrintAssetGroup(assetGroup: AdminAssetGroup) {
  coreUiKeyValues({
    address: assetGroup.address,
    createdAt: coreUiFormatOptionalDate(assetGroup.createdAt),
    decimals: assetGroup.decimals,
    enabled: assetGroup.enabled,
    id: assetGroup.id,
    imageUrl: assetGroup.imageUrl,
    label: assetGroup.label,
    resolverKind: assetGroup.resolverKind,
    symbol: assetGroup.symbol,
    type: assetGroup.type,
    updatedAt: coreUiFormatOptionalDate(assetGroup.updatedAt),
  })
}

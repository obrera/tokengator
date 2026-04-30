import type { AdminAssetGroup, AdminAssetGroupListResult } from '../api/data-access/admin-api-client'
import { formatOptionalDate, printKeyValues, printTable } from '../api/ui/api-output'

type JsonRecord = Record<string, unknown>

function getRecord(value: unknown): JsonRecord | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonRecord) : undefined
}

function getSuggestion(input: JsonRecord): JsonRecord {
  return getRecord(input.suggestion) ?? {}
}

export function assetGroupsUiPrintAssetGroup(assetGroup: AdminAssetGroup) {
  printKeyValues({
    address: assetGroup.address,
    createdAt: formatOptionalDate(assetGroup.createdAt),
    decimals: assetGroup.decimals,
    enabled: assetGroup.enabled,
    id: assetGroup.id,
    imageUrl: assetGroup.imageUrl,
    label: assetGroup.label,
    resolverKind: assetGroup.resolverKind,
    symbol: assetGroup.symbol,
    type: assetGroup.type,
    updatedAt: formatOptionalDate(assetGroup.updatedAt),
  })
}

export function assetGroupsUiPrintAssetGroupDeleted(assetGroupId: string) {
  console.log(`Deleted asset group "${assetGroupId}".`)
}

export function assetGroupsUiPrintAssetGroupList(result: AdminAssetGroupListResult) {
  printTable(
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

export function assetGroupsUiPrintIndexResult(result: JsonRecord) {
  printKeyValues(result)
}

export function assetGroupsUiPrintIndexRuns(indexRuns: JsonRecord[]) {
  printTable(
    indexRuns,
    [
      {
        key: 'deletedCount',
        label: 'deletedCount',
        value: (run) => run.deletedCount,
      },
      {
        key: 'finishedAt',
        label: 'finishedAt',
        value: (run) => formatOptionalDate(run.finishedAt),
      },
      {
        key: 'id',
        label: 'id',
        value: (run) => run.id,
      },
      {
        key: 'insertedCount',
        label: 'insertedCount',
        value: (run) => run.insertedCount,
      },
      {
        key: 'startedAt',
        label: 'startedAt',
        value: (run) => formatOptionalDate(run.startedAt),
      },
      {
        key: 'status',
        label: 'status',
        value: (run) => run.status,
      },
      {
        key: 'totalCount',
        label: 'totalCount',
        value: (run) => run.totalCount,
      },
      {
        key: 'updatedCount',
        label: 'updatedCount',
        value: (run) => run.updatedCount,
      },
    ],
    'No index runs found.',
  )
}

export function assetGroupsUiPrintLookup(result: JsonRecord) {
  const suggestion = getSuggestion(result)

  printKeyValues({
    account: result.account,
    address: suggestion.address,
    cluster: result.cluster,
    existingAssetGroupId: getRecord(result.existingAssetGroup)?.id,
    label: suggestion.label,
    reason: suggestion.reason,
    resolvable: suggestion.resolvable,
    resolverKind: suggestion.resolverKind,
    symbol: suggestion.symbol,
    type: suggestion.type,
  })
}

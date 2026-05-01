import { coreUiKeyValues } from '../../core/ui/core-ui-key-values'

type JsonRecord = Record<string, unknown>

function getRecord(value: unknown): JsonRecord | undefined {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as JsonRecord) : undefined
}

function getSuggestion(input: JsonRecord): JsonRecord {
  return getRecord(input.suggestion) ?? {}
}

export function assetGroupsUiPrintLookup(result: JsonRecord) {
  const suggestion = getSuggestion(result)

  coreUiKeyValues({
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

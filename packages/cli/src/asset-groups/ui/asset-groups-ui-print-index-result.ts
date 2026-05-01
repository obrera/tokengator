import { coreUiKeyValues } from '../../core/ui/core-ui-key-values'

type JsonRecord = Record<string, unknown>

export function assetGroupsUiPrintIndexResult(result: JsonRecord) {
  coreUiKeyValues(result)
}

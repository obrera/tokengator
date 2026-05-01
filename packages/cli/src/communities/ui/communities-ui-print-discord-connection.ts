import { coreUiKeyValues } from '../../core/ui/core-ui-key-values'

type JsonRecord = Record<string, unknown>

export function communitiesUiPrintDiscordConnection(connection: JsonRecord | null) {
  coreUiKeyValues(connection ?? {})
}

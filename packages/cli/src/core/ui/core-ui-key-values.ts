import { coreUiFormatCell } from './core-ui-format-cell'

export function coreUiKeyValues(values: Record<string, unknown>) {
  for (const [key, value] of Object.entries(values).sort(([left], [right]) => left.localeCompare(right))) {
    const formattedValue = coreUiFormatCell(value)

    if (formattedValue) {
      console.log(`${key}: ${formattedValue}`)
    }
  }
}

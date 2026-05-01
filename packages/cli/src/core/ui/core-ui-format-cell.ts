export function coreUiFormatCell(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'boolean') {
    return value ? 'yes' : 'no'
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return String(value)
}

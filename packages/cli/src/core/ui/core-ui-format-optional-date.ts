export function coreUiFormatOptionalDate(value: unknown): string {
  if (!value) {
    return ''
  }

  return String(value)
}

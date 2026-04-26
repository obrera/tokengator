export function normalizeCliAuthUserCode(value: string | undefined): string | undefined {
  const userCode = value
    ?.replace(/[\s-]+/g, '')
    .trim()
    .toUpperCase()

  return userCode || undefined
}

export interface CliAuthorizeSearch {
  user_code?: string
}

export function validateCliAuthorizeSearch(search: Record<string, unknown>): CliAuthorizeSearch {
  return {
    user_code: typeof search.user_code === 'string' ? normalizeCliAuthUserCode(search.user_code) : undefined,
  }
}

export interface AuthLocalRedirectSearch {
  redirect?: string
}

export function getAuthLocalRedirect(value: unknown): string | undefined {
  if (typeof value !== 'string') {
    return undefined
  }

  const redirect = value.trim()

  if (!redirect.startsWith('/')) {
    return undefined
  }

  if (redirect.includes('\\') || /%(?:2f|5c)/i.test(redirect)) {
    return undefined
  }

  if (redirect.startsWith('//')) {
    return undefined
  }

  return redirect
}

export function validateAuthLocalRedirectSearch(search: Record<string, unknown>): AuthLocalRedirectSearch {
  return {
    redirect: getAuthLocalRedirect(search.redirect),
  }
}

export function getCliAuthDeviceErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === 'object') {
    const message = 'message' in error ? error.message : undefined

    if (typeof message === 'string' && message.trim()) {
      return message
    }
  }

  return fallback
}

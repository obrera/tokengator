import {
  AuthError,
  requestDeviceCode,
  requestDeviceToken,
  type AuthApiFetch,
  type AuthDeviceCode,
  type AuthDeviceToken,
} from './auth-api-client'
import { openAuthBrowser } from './auth-browser'

export const TOKENGATOR_CLI_CLIENT_ID = 'tokengator-cli'
export const TOKENGATOR_CLI_SCOPE = 'cli'

type AuthDeviceFlowClient = {
  requestDeviceCode: typeof requestDeviceCode
  requestDeviceToken: typeof requestDeviceToken
}

type AuthDeviceFlowSleep = (milliseconds: number, signal?: AbortSignal) => Promise<void>

const defaultClient: AuthDeviceFlowClient = {
  requestDeviceCode,
  requestDeviceToken,
}

function createCancelError() {
  return new AuthError('CLI login was canceled.')
}

function defaultSleep(milliseconds: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      reject(createCancelError())
      return
    }

    const timeout = setTimeout(resolve, milliseconds)

    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timeout)
        reject(createCancelError())
      },
      { once: true },
    )
  })
}

function getPollingError(error: AuthError): AuthError {
  if (error.code === 'access_denied') {
    return new AuthError('CLI access was denied in the browser.', {
      code: error.code,
      details: error.details,
      status: error.status,
    })
  }

  if (error.code === 'expired_token') {
    return new AuthError('The CLI authorization code expired. Run "tokengator auth login" again.', {
      code: error.code,
      details: error.details,
      status: error.status,
    })
  }

  if (error.code === 'invalid_grant') {
    return new AuthError('The CLI authorization code is no longer valid. Run "tokengator auth login" again.', {
      code: error.code,
      details: error.details,
      status: error.status,
    })
  }

  return error
}

function getExpiredAuthorizationCodeError() {
  return new AuthError('The CLI authorization code expired. Run "tokengator auth login" again.', {
    code: 'expired_token',
  })
}

function printDeviceAuthorization(args: { deviceCode: AuthDeviceCode; writeLine: (message: string) => void }) {
  args.writeLine('Authorize Tokengator CLI in your browser.')
  args.writeLine(`Code: ${args.deviceCode.user_code}`)
  args.writeLine(`URL: ${args.deviceCode.verification_uri_complete}`)
}

export async function runDeviceAuthorizationFlow(args: {
  apiUrl: string
  client?: AuthDeviceFlowClient
  fetch?: AuthApiFetch
  noOpen?: boolean
  now?: () => number
  openBrowser?: typeof openAuthBrowser
  signal?: AbortSignal
  sleep?: AuthDeviceFlowSleep
  verbose?: boolean
  writeLine?: (message: string) => void
}): Promise<AuthDeviceToken> {
  const client = args.client ?? defaultClient
  const sleep = args.sleep ?? defaultSleep
  const writeLine = args.writeLine ?? console.log
  const now = args.now ?? Date.now
  const deviceCode = await client.requestDeviceCode({
    apiUrl: args.apiUrl,
    clientId: TOKENGATOR_CLI_CLIENT_ID,
    fetch: args.fetch,
    scope: TOKENGATOR_CLI_SCOPE,
    signal: args.signal,
    verbose: args.verbose,
  })

  printDeviceAuthorization({ deviceCode, writeLine })

  if (args.noOpen) {
    writeLine('Browser opening is disabled for this login.')
  } else {
    await (args.openBrowser ?? openAuthBrowser)({
      url: deviceCode.verification_uri_complete,
      writeLine,
    })
  }

  let pollingIntervalMs = Math.max(deviceCode.interval, 1) * 1000
  const pollingDeadlineMs = now() + deviceCode.expires_in * 1000

  while (true) {
    if (now() >= pollingDeadlineMs) {
      throw getExpiredAuthorizationCodeError()
    }

    await sleep(pollingIntervalMs, args.signal)

    if (now() >= pollingDeadlineMs) {
      throw getExpiredAuthorizationCodeError()
    }

    try {
      return await client.requestDeviceToken({
        apiUrl: args.apiUrl,
        clientId: TOKENGATOR_CLI_CLIENT_ID,
        deviceCode: deviceCode.device_code,
        fetch: args.fetch,
        signal: args.signal,
        verbose: args.verbose,
      })
    } catch (error) {
      if (!(error instanceof AuthError)) {
        throw error
      }

      if (error.code === 'authorization_pending') {
        continue
      }

      if (error.code === 'slow_down') {
        pollingIntervalMs += 5000
        continue
      }

      throw getPollingError(error)
    }
  }
}

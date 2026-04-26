import { auth } from '@tokengator/auth'

import type { ProfileRevokeApiKeyInput } from './profile-api-key-revoke-input'

const CLI_API_KEY_CONFIG_ID = 'cli'

export async function profileApiKeyRevoke(input: { apiKey: ProfileRevokeApiKeyInput; requestHeaders: Headers }) {
  await auth.api.deleteApiKey({
    body: {
      configId: CLI_API_KEY_CONFIG_ID,
      keyId: input.apiKey.id,
    },
    headers: input.requestHeaders,
  })

  return {
    apiKeyId: input.apiKey.id,
  }
}

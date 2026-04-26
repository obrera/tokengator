import { auth } from '@tokengator/auth'

import { toProfileApiKeyEntity } from './profile.entity'

const CLI_API_KEY_CONFIG_ID = 'cli'

type ProfileApiKeyEntity = ReturnType<typeof toProfileApiKeyEntity>

function compareDateDesc(left: Date | null, right: Date | null) {
  const leftTime = left?.getTime() ?? 0
  const rightTime = right?.getTime() ?? 0

  return rightTime - leftTime
}

function getProfileApiKeySortValue(apiKey: ProfileApiKeyEntity) {
  return apiKey.name ?? apiKey.start ?? apiKey.id
}

function sortProfileApiKeysByLastUsed(left: ProfileApiKeyEntity, right: ProfileApiKeyEntity) {
  return (
    compareDateDesc(left.lastRequest, right.lastRequest) ||
    compareDateDesc(left.createdAt, right.createdAt) ||
    getProfileApiKeySortValue(left).localeCompare(getProfileApiKeySortValue(right))
  )
}

export async function profileApiKeyList(input: { requestHeaders: Headers }) {
  const result = await auth.api.listApiKeys({
    headers: input.requestHeaders,
    query: {
      configId: CLI_API_KEY_CONFIG_ID,
    },
  })
  const apiKeys = result.apiKeys.map(toProfileApiKeyEntity).sort(sortProfileApiKeysByLastUsed)

  return {
    apiKeys,
  }
}

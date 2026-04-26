import { protectedProcedure } from '../../../lib/procedures'

import { profileApiKeyList as profileApiKeyListDataAccess } from '../data-access/profile-api-key-list'

export const profileFeatureListApiKeys = protectedProcedure.handler(async ({ context }) => {
  return await profileApiKeyListDataAccess({
    requestHeaders: context.requestHeaders,
  })
})

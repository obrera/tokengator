import type { RealmsApiAdapter } from '../adapters/realms-api'
import { ProviderError } from '../errors'
import { defineResolver, type ResolverDefinition } from '../resolver'
import { REALMS_VOTERS } from '../resolver-kind'

export interface RealmsVotersConfig {
  realm: string
}

export const REALMS_PROGRAM_ID = 'GovER5Lthms3bLBqWub97yVrMmEogzX7xNjdXpPPCVZw'

export function createRealmsResolvers(adapter: RealmsApiAdapter): ResolverDefinition[] {
  return [
    defineResolver<RealmsVotersConfig>({
      kind: REALMS_VOTERS,
      async resolve({ context, onPage, resolver }) {
        assertNotAborted(context.signal)

        const items = await adapter.getRealmVoters({
          realm: resolver.config.realm,
          signal: context.signal,
        })

        assertNotAborted(context.signal)

        if (items.length === 0) {
          return {
            errors: [],
            pages: 0,
            total: 0,
          }
        }

        await onPage({
          items,
          page: 1,
        })

        return {
          errors: [],
          pages: 1,
          total: items.length,
        }
      },
    }),
  ]
}

function assertNotAborted(signal?: AbortSignal): void {
  if (!signal?.aborted) {
    return
  }

  throw new ProviderError({
    code: 'provider_error',
    message: 'Resolver aborted by signal',
    metadata: {
      reason: 'aborted',
    },
    provider: 'realms',
    retryable: false,
  })
}

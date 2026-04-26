import { afterAll, describe, expect, mock, test } from 'bun:test'

let authCallbackState: {
  authenticatedHomePath: '/onboard' | '/profile'
  session: { user: { id: string } } | null
} = {
  authenticatedHomePath: '/profile',
  session: null,
}

mock.module('../src/features/auth/data-access/finalize-discord-auth', () => ({
  finalizeDiscordAuthState: async () => authCallbackState,
}))

const { Route: AuthCallbackRoute } = await import('../src/routes/auth-callback')

afterAll(() => {
  mock.restore()
})

describe('auth callback route', () => {
  test('preserves redirect when auth callback does not create a session', async () => {
    authCallbackState = {
      authenticatedHomePath: '/profile',
      session: null,
    }

    try {
      await AuthCallbackRoute.options.beforeLoad?.({
        context: {
          queryClient: {},
        },
        search: {
          redirect: '/cli/authorize?user_code=ABCD1234',
        },
      } as never)
    } catch (error) {
      expect(error).toMatchObject({
        options: {
          search: {
            redirect: '/cli/authorize?user_code=ABCD1234',
          },
          to: '/login',
        },
      })

      return
    }

    throw new Error('Expected the route to redirect.')
  })
})

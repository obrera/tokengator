import { afterAll, beforeAll, describe, expect, mock, test } from 'bun:test'

import { canAccessProfileSettings, getProfileIndexRedirect } from '../src/features/profile/util/profile-route-access'
import { Route as ProfileUsernameIndexRoute } from '../src/routes/profile/$username/index'

let ProfileRoute: typeof import('../src/routes/profile/route').Route

interface TestAppAuthState {
  authenticatedHomePath: '/onboard' | '/profile'
  identities: null
  isOnboardingComplete: boolean
  onboardingStatus: null
  profileSettings: null
  session: {
    user: {
      id: string
      image: string | null
      name: string
      role: 'admin' | 'user'
      username: string | null
    }
  } | null
  solanaWallets: null
}

function createAppAuthState(overrides?: Partial<TestAppAuthState>): TestAppAuthState {
  return {
    authenticatedHomePath: '/profile',
    identities: null,
    isOnboardingComplete: true,
    onboardingStatus: null,
    profileSettings: null,
    session: {
      user: {
        id: 'user-1',
        image: null,
        name: 'Alice',
        role: 'user',
        username: 'alice',
      },
    },
    solanaWallets: null,
    ...overrides,
  }
}

beforeAll(async () => {
  mock.module('../src/features/auth/data-access/get-app-auth-state', () => ({
    getAppAuthStateQueryOptions: () => ({}),
  }))

  ;({ Route: ProfileRoute } = await import('../src/routes/profile/route'))
})

afterAll(() => {
  mock.restore()
})

describe('profile route helpers', () => {
  test('redirects /profile to the signed-in username route', () => {
    expect(
      getProfileIndexRedirect({
        user: {
          id: 'user-1',
          name: 'Alice',
          username: 'alice',
        },
      }),
    ).toEqual({
      params: {
        username: 'alice',
      },
      to: '/profile/$username',
    })
  })

  test('redirects /profile to onboard when the session has no username', () => {
    expect(
      getProfileIndexRedirect({
        user: {
          id: 'user-1',
          name: 'Alice',
          username: null,
        },
      }),
    ).toEqual({
      to: '/onboard',
    })
  })

  test('allows only the owner to access username settings routes', () => {
    expect(
      canAccessProfileSettings({
        session: {
          user: {
            id: 'user-1',
            name: 'Alice',
            username: 'alice',
          },
        },
        username: 'alice',
      }),
    ).toBe(true)
    expect(
      canAccessProfileSettings({
        session: {
          user: {
            id: 'user-2',
            name: 'Bob',
            username: 'bob',
          },
        },
        username: 'alice',
      }),
    ).toBe(false)
  })

  test('redirects the username index route to the assets tab', async () => {
    try {
      await ProfileUsernameIndexRoute.options.beforeLoad?.({
        params: {
          username: 'alice',
        },
      } as never)
    } catch (error) {
      expect(error).toMatchObject({
        options: {
          params: {
            username: 'alice',
          },
          to: '/profile/$username/assets',
        },
      })

      return
    }

    throw new Error('Expected the route to redirect.')
  })

  test('redirects /profile to login without a session', async () => {
    try {
      await ProfileRoute.options.beforeLoad?.({
        context: {
          queryClient: {
            ensureQueryData: async () => createAppAuthState({ session: null }),
          },
        },
      } as never)
    } catch (error) {
      expect(error).toMatchObject({
        options: {
          to: '/login',
        },
      })

      return
    }

    throw new Error('Expected the route to redirect.')
  })

  test('allows onboarded users to access /profile children', async () => {
    const appAuthState = createAppAuthState()
    const { session } = appAuthState

    if (!session) {
      throw new Error('Expected an authenticated session.')
    }

    await expect(
      ProfileRoute.options.beforeLoad?.({
        context: {
          queryClient: {
            ensureQueryData: async () => appAuthState,
          },
        },
      } as never),
    ).resolves.toEqual({ session })
  })

  test('redirects unonboarded non-admin users from /profile to onboard', async () => {
    try {
      await ProfileRoute.options.beforeLoad?.({
        context: {
          queryClient: {
            ensureQueryData: async () => createAppAuthState({ isOnboardingComplete: false }),
          },
        },
      } as never)
    } catch (error) {
      expect(error).toMatchObject({
        options: {
          to: '/onboard',
        },
      })

      return
    }

    throw new Error('Expected the route to redirect.')
  })

  test('redirects unonboarded admins from /profile to admin', async () => {
    try {
      await ProfileRoute.options.beforeLoad?.({
        context: {
          queryClient: {
            ensureQueryData: async () =>
              createAppAuthState({
                isOnboardingComplete: false,
                session: {
                  user: {
                    id: 'user-1',
                    image: null,
                    name: 'Alice',
                    role: 'admin',
                    username: 'alice',
                  },
                },
              }),
          },
        },
      } as never)
    } catch (error) {
      expect(error).toMatchObject({
        options: {
          to: '/admin',
        },
      })

      return
    }

    throw new Error('Expected the route to redirect.')
  })
})

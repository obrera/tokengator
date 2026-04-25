import { describe, expect, test } from 'bun:test'

const WEB_SERVER_ENV_KEYS = ['API_URL', 'VITE_SERVER_ALLOWED_HOSTS', 'VITE_SERVER_HOST', 'VITE_SERVER_PORT'] as const

function withWebServerEnv(overrides: Partial<Record<(typeof WEB_SERVER_ENV_KEYS)[number], string | undefined>> = {}) {
  const previousEnv = new Map<string, string | undefined>()

  for (const key of WEB_SERVER_ENV_KEYS) {
    previousEnv.set(key, process.env[key])
  }

  Object.assign(process.env, {
    API_URL: 'http://127.0.0.1:4000',
  })

  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) {
      delete process.env[key]
      continue
    }

    process.env[key] = value
  }

  return () => {
    for (const key of WEB_SERVER_ENV_KEYS) {
      const previousValue = previousEnv.get(key)

      if (previousValue === undefined) {
        delete process.env[key]
        continue
      }

      process.env[key] = previousValue
    }
  }
}

describe('web server env', () => {
  test('defaults web server config when optional values are unset', async () => {
    const restoreEnv = withWebServerEnv({
      API_URL: undefined,
      VITE_SERVER_ALLOWED_HOSTS: undefined,
      VITE_SERVER_HOST: undefined,
      VITE_SERVER_PORT: undefined,
    })

    try {
      const { env } = await import(`../src/web-server.ts?test=${Date.now()}-defaults`)

      expect(env.API_URL).toBe('http://localhost:3000')
      expect(env.VITE_SERVER_ALLOWED_HOSTS).toEqual([])
      expect(env.VITE_SERVER_HOST).toBeUndefined()
      expect(env.VITE_SERVER_PORT).toBe(3001)
    } finally {
      restoreEnv()
    }
  })

  test('parses API_URL', async () => {
    const restoreEnv = withWebServerEnv()

    try {
      const { env } = await import(`../src/web-server.ts?test=${Date.now()}-api-url`)

      expect(env.API_URL).toBe('http://127.0.0.1:4000')
    } finally {
      restoreEnv()
    }
  })

  test('parses VITE_SERVER_ALLOWED_HOSTS', async () => {
    const restoreEnv = withWebServerEnv({
      VITE_SERVER_ALLOWED_HOSTS: '  beta.example.com, alpha.example.com, beta.example.com  ',
    })

    try {
      const { env } = await import(`../src/web-server.ts?test=${Date.now()}-allowed-hosts`)

      expect(env.VITE_SERVER_ALLOWED_HOSTS).toEqual(['alpha.example.com', 'beta.example.com'])
    } finally {
      restoreEnv()
    }
  })

  test('parses VITE_SERVER_HOST=true', async () => {
    const restoreEnv = withWebServerEnv({
      VITE_SERVER_HOST: 'true',
    })

    try {
      const { env } = await import(`../src/web-server.ts?test=${Date.now()}-host-true`)

      expect(env.VITE_SERVER_HOST).toBe(true)
    } finally {
      restoreEnv()
    }
  })

  test('ignores VITE_SERVER_HOST when it is not true', async () => {
    const restoreEnv = withWebServerEnv({
      VITE_SERVER_HOST: 'false',
    })

    try {
      const { env } = await import(`../src/web-server.ts?test=${Date.now()}-host-false`)

      expect(env.VITE_SERVER_HOST).toBeUndefined()
    } finally {
      restoreEnv()
    }
  })

  test('parses VITE_SERVER_PORT', async () => {
    const restoreEnv = withWebServerEnv({
      VITE_SERVER_PORT: '4101',
    })

    try {
      const { env } = await import(`../src/web-server.ts?test=${Date.now()}-port`)

      expect(env.VITE_SERVER_PORT).toBe(4101)
    } finally {
      restoreEnv()
    }
  })

  test('rejects VITE_SERVER_PORT outside the valid port range', async () => {
    const restoreEnv = withWebServerEnv({
      VITE_SERVER_PORT: '65536',
    })

    try {
      await expect(import(`../src/web-server.ts?test=${Date.now()}-invalid-port`)).rejects.toThrow(
        'Invalid environment variables',
      )
    } finally {
      restoreEnv()
    }
  })
})

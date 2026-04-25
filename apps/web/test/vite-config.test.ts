import { describe, expect, test } from 'bun:test'

describe('vite config', () => {
  test('configures the dev server proxy through validated env', async () => {
    const { default: config } = await import(`../vite.config.ts?test=${Date.now()}-server-env`)
    const proxy = config.server?.proxy as Record<string, { changeOrigin?: boolean; target?: string }>

    expect(Array.isArray(config.server?.allowedHosts)).toBe(true)
    expect(typeof config.server?.port).toBe('number')
    expect(proxy['/api']).toMatchObject({ changeOrigin: true })
    expect(proxy['/api']?.target).toBe(proxy['/rpc']?.target)
    expect(proxy['/rpc']).toMatchObject({ changeOrigin: true })
  })
})

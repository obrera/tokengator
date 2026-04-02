import { getRequestHeaders } from '@tanstack/react-start/server'
import { env } from '@tokengator/env/web'
import { createOrpcClient } from '@tokengator/sdk'

const internalApiUrl = process.env.INTERNAL_API_URL || env.VITE_API_URL

export const serverOrpcClient = createOrpcClient({
  baseUrl: internalApiUrl,
  headers: () => getRequestHeaders(),
})

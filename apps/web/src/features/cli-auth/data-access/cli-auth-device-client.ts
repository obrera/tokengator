import type { getAuthClientClient } from '@/features/auth/data-access/auth-client-client'

export type CliAuthDeviceClient = Pick<ReturnType<typeof getAuthClientClient>, 'device'>

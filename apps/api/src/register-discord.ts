import dotenv from 'dotenv'
import { fileURLToPath } from 'node:url'

dotenv.config({
  path: fileURLToPath(new URL('../.env', import.meta.url)),
  quiet: true,
})

const { registerDiscordCommands } = await import('@tokengator/discord')

await registerDiscordCommands()

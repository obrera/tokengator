#!/usr/bin/env node

import { Command } from 'commander'
import pc from 'picocolors'
import packageJson from '../package.json'
import { createAuthCommand } from './auth/auth-command'
import { AuthError } from './auth/data-access/auth-api-client'
import { createConfigCommand } from './config/config-command'

function createProgram(): Command {
  const program = new Command()
    .name(packageJson.name)
    .description(packageJson.description)
    .version(packageJson.version)
    .action(() => {
      program.outputHelp()
    })

  program.addCommand(createAuthCommand())
  program.addCommand(createConfigCommand())

  return program
}

async function main() {
  await createProgram().parseAsync(process.argv)
}

function printCliError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Unexpected error'

  console.error(pc.red(message))

  if (error instanceof AuthError && error.details?.length) {
    for (const detail of error.details) {
      console.error(pc.dim(detail))
    }
  }
}

main().catch((error: unknown) => {
  printCliError(error)
  process.exitCode = 1
})

#!/usr/bin/env node

import { Command } from 'commander'
import pc from 'picocolors'
import packageJson from '../package.json'
import { createConfigCommand } from './config/config-command'

function createProgram(): Command {
  const program = new Command()
    .name(packageJson.name)
    .description(packageJson.description)
    .version(packageJson.version)
    .action(() => {
      program.outputHelp()
    })

  program.addCommand(createConfigCommand())

  return program
}

async function main() {
  await createProgram().parseAsync(process.argv)
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unexpected error'

  console.error(pc.red(message))
  process.exitCode = 1
})

#!/usr/bin/env node

import { cancel, intro, isCancel, outro, text } from '@clack/prompts'
import { Command } from 'commander'
import pc from 'picocolors'
import packageJson from '../package.json'
import { greet } from './index'

type CliOptions = {
  name?: string
}

const version = packageJson.version

function normalizeName(name: string | undefined): string | undefined {
  const trimmed = name?.trim()

  return trimmed || undefined
}

async function resolveName(options: CliOptions): Promise<string | undefined> {
  const optionName = normalizeName(options.name)

  if (optionName) {
    return optionName
  }

  const answer = await text({
    defaultValue: 'World',
    message: 'Who should Tokengator greet?',
    placeholder: 'World',
  })

  if (isCancel(answer)) {
    cancel('Demo cancelled.')

    return undefined
  }

  return normalizeName(answer) ?? 'World'
}

async function main() {
  const program = new Command()
    .name('tokengator')
    .description('Interactive hello world demo for Tokengator.')
    .version(version)
    .option('-n, --name <name>', 'name to greet')

  await program.parseAsync(process.argv)

  intro(pc.cyan(`tokengator v${version}`))

  const name = await resolveName(program.opts<CliOptions>())

  if (!name) {
    return
  }

  outro(pc.green(greet(name)))
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unexpected error'

  console.error(pc.red(message))
  process.exitCode = 1
})

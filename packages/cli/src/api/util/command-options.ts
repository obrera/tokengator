import { Command, InvalidArgumentError } from 'commander'

export type CommonAdminCommandOptions = {
  json?: boolean
  profile?: string
  verbose?: boolean
}

export function addCommonAdminOptions(command: Command): Command {
  return command
    .option('--json', 'Print the raw JSON response.')
    .option('--profile <profile>', 'Profile to use.')
    .option('--verbose', 'Show API request failure details.')
}

export function getOptionalNumber(value: number | undefined): number | undefined {
  return typeof value === 'number' ? value : undefined
}

export function getOptionalString(value: string | undefined): string | undefined {
  const trimmedValue = value?.trim()

  return trimmedValue ? trimmedValue : undefined
}

export function parseIntegerOption(input: string, options: { max?: number; min?: number; name: string }): number {
  const value = Number(input)

  if (!Number.isInteger(value)) {
    throw new InvalidArgumentError(`${options.name} must be an integer.`)
  }

  if (options.min !== undefined && value < options.min) {
    throw new InvalidArgumentError(`${options.name} must be at least ${options.min}.`)
  }

  if (options.max !== undefined && value > options.max) {
    throw new InvalidArgumentError(`${options.name} must be at most ${options.max}.`)
  }

  return value
}

export function pickDefined<T extends Record<string, unknown>>(input: T): Partial<T> | undefined {
  const entries = Object.entries(input).filter(([, value]) => value !== undefined)

  return entries.length ? (Object.fromEntries(entries) as Partial<T>) : undefined
}

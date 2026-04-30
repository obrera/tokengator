import { cancel, confirm, isCancel } from '@clack/prompts'

type TableColumn<T> = {
  key: string
  label: string
  value: (row: T) => unknown
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }

  if (typeof value === 'boolean') {
    return value ? 'yes' : 'no'
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return String(value)
}

function getColumnWidths<T>(rows: T[], columns: TableColumn<T>[]): number[] {
  return columns.map((column) =>
    Math.max(column.label.length, ...rows.map((row) => formatCell(column.value(row)).length)),
  )
}

function printRow(cells: string[], widths: number[]) {
  console.log(cells.map((cell, index) => cell.padEnd(widths[index] ?? 0)).join('  '))
}

function printSeparator(widths: number[]) {
  console.log(widths.map((width) => '-'.repeat(width)).join('  '))
}

export async function confirmDestructiveAction(input: { message: string; yes?: boolean }): Promise<void> {
  if (input.yes) {
    return
  }

  if (!process.stdin.isTTY) {
    throw new Error('Pass --yes to confirm this destructive action.')
  }

  const answer = await confirm({
    initialValue: false,
    message: input.message,
  })

  if (isCancel(answer)) {
    cancel('Cancelled.')
    throw new Error('Cancelled.')
  }

  if (!answer) {
    throw new Error('Cancelled.')
  }
}

export function formatOptionalDate(value: unknown): string {
  if (!value) {
    return ''
  }

  return String(value)
}

export function printJson(value: unknown) {
  console.log(JSON.stringify(value, null, 2))
}

export function printKeyValues(values: Record<string, unknown>) {
  for (const [key, value] of Object.entries(values).sort(([left], [right]) => left.localeCompare(right))) {
    const formattedValue = formatCell(value)

    if (formattedValue) {
      console.log(`${key}: ${formattedValue}`)
    }
  }
}

export function printTable<T>(rows: T[], columns: TableColumn<T>[], emptyMessage: string) {
  if (rows.length === 0) {
    console.log(emptyMessage)
    return
  }

  const sortedColumns = [...columns].sort((left, right) => left.label.localeCompare(right.label))
  const widths = getColumnWidths(rows, sortedColumns)

  printRow(
    sortedColumns.map((column) => column.label),
    widths,
  )
  printSeparator(widths)

  for (const row of rows) {
    printRow(
      sortedColumns.map((column) => formatCell(column.value(row))),
      widths,
    )
  }
}

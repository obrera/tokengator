import { coreUiFormatCell } from './core-ui-format-cell'

export type TableColumn<T> = {
  key: string
  label: string
  value: (row: T) => unknown
}

function getColumnWidths<T>(rows: T[], columns: TableColumn<T>[]): number[] {
  return columns.map((column) =>
    Math.max(column.label.length, ...rows.map((row) => coreUiFormatCell(column.value(row)).length)),
  )
}

function printSeparator(widths: number[]) {
  console.log(widths.map((width) => '-'.repeat(width)).join('  '))
}

function printRow(cells: string[], widths: number[]) {
  console.log(cells.map((cell, index) => cell.padEnd(widths[index] ?? 0)).join('  '))
}

export function coreUiTable<T>(rows: T[], columns: TableColumn<T>[], emptyMessage: string) {
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
      sortedColumns.map((column) => coreUiFormatCell(column.value(row))),
      widths,
    )
  }
}

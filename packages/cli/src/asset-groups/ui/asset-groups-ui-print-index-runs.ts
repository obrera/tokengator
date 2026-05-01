import { coreUiFormatOptionalDate } from '../../core/ui/core-ui-format-optional-date'
import { coreUiTable } from '../../core/ui/core-ui-table'

type JsonRecord = Record<string, unknown>

export function assetGroupsUiPrintIndexRuns(indexRuns: JsonRecord[]) {
  coreUiTable(
    indexRuns,
    [
      {
        key: 'deletedCount',
        label: 'deletedCount',
        value: (run) => run.deletedCount,
      },
      {
        key: 'finishedAt',
        label: 'finishedAt',
        value: (run) => coreUiFormatOptionalDate(run.finishedAt),
      },
      {
        key: 'id',
        label: 'id',
        value: (run) => run.id,
      },
      {
        key: 'insertedCount',
        label: 'insertedCount',
        value: (run) => run.insertedCount,
      },
      {
        key: 'startedAt',
        label: 'startedAt',
        value: (run) => coreUiFormatOptionalDate(run.startedAt),
      },
      {
        key: 'status',
        label: 'status',
        value: (run) => run.status,
      },
      {
        key: 'totalCount',
        label: 'totalCount',
        value: (run) => run.totalCount,
      },
      {
        key: 'updatedCount',
        label: 'updatedCount',
        value: (run) => run.updatedCount,
      },
    ],
    'No index runs found.',
  )
}

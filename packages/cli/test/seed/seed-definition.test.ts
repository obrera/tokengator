import { describe, expect, test } from 'bun:test'
import { join } from 'node:path'

import {
  loadSeedDefinition,
  resolveSeedDefinitionPath,
  seedDefinitionSchema,
} from '../../src/seed/data-access/seed-definition'

describe('seed definition loader', () => {
  test('loads the default development seed definition', () => {
    const definition = loadSeedDefinition('scripts/default-dev-seed.json')

    expect(definition.discordOrganizationSlug).toBe('acme')
  })

  test('resolves repo-root paths when the cli runs from the package directory', () => {
    const cliPackageDirectory = join(import.meta.dir, '../..')
    const resolvedPath = resolveSeedDefinitionPath('scripts/default-dev-seed.json', cliPackageDirectory)

    expect(resolvedPath.replaceAll('\\', '/')).toEndWith('/scripts/default-dev-seed.json')
  })

  test('rejects non-numeric community role amounts', () => {
    expect(() =>
      seedDefinitionSchema.parse({
        assetGroups: [],
        bootstrapUsername: 'admin',
        communityRoles: [
          {
            conditions: [
              {
                assetGroupLabel: 'holders',
                maximumAmount: null,
                minimumAmount: 'one',
              },
            ],
            enabled: true,
            matchMode: 'all',
            name: 'Holder',
            slug: 'holder',
          },
        ],
        organizations: [],
        users: [],
      }),
    ).toThrow('Amount must be a positive integer.')
  })
})

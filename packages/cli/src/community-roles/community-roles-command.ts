import { Command, InvalidArgumentError } from 'commander'

import type { AdminCommunityRoleCreateInput } from '../api/data-access/admin-api-client'
import { addCommonAdminOptions } from '../api/util/command-options'
import { communityRolesFeatureCreate } from './community-roles-feature-create'

type CommunityRoleMatchMode = 'all' | 'any'
type CommunityRoleConditionInput = AdminCommunityRoleCreateInput['data']['conditions'][number]

type CommunityRolesCreateCommandOptions = {
  condition: CommunityRoleConditionInput[]
  disabled?: boolean
  json?: boolean
  matchMode: CommunityRoleMatchMode
  name: string
  organizationId: string
  profile?: string
  slug: string
  verbose?: boolean
}

function collectCondition(value: string, previous: CommunityRoleConditionInput[] = []) {
  return [...previous, parseCondition(value)]
}

function parseCondition(value: string): CommunityRoleConditionInput {
  const parts = value.split(':')

  if (parts.length < 2 || parts.length > 3) {
    throw new InvalidArgumentError('condition must be assetGroupId:minimumAmount[:maximumAmount].')
  }

  const [assetGroupId, minimumAmount, maximumAmount] = parts.map((part) => part.trim())

  if (!assetGroupId || !minimumAmount) {
    throw new InvalidArgumentError('condition must be assetGroupId:minimumAmount[:maximumAmount].')
  }

  return {
    assetGroupId,
    maximumAmount: maximumAmount ? maximumAmount : null,
    minimumAmount,
  }
}

function parseMatchMode(value: string): CommunityRoleMatchMode {
  if (value !== 'all' && value !== 'any') {
    throw new InvalidArgumentError('match-mode must be all or any.')
  }

  return value
}

export function createCommunityRolesCommand(): Command {
  const communityRolesCommand = new Command('community-roles')
    .description('Manage Tokengator community roles.')
    .action(() => {
      communityRolesCommand.outputHelp()
    })

  addCommonAdminOptions(
    communityRolesCommand
      .command('create')
      .description('Create a community role.')
      .requiredOption(
        '--condition <condition>',
        'Condition as assetGroupId:minimumAmount[:maximumAmount].',
        collectCondition,
      )
      .requiredOption('--match-mode <matchMode>', 'Role match mode.', parseMatchMode)
      .requiredOption('--name <name>', 'Community role name.')
      .requiredOption('--organization-id <organizationId>', 'Community organization ID.')
      .requiredOption('--slug <slug>', 'Community role slug.')
      .option('--disabled', 'Create the community role disabled.'),
  ).action(async (options: CommunityRolesCreateCommandOptions) => {
    if (!options.condition?.length) {
      throw new InvalidArgumentError('At least one --condition is required.')
    }

    await communityRolesFeatureCreate({
      ...options,
      conditions: options.condition,
    })
  })

  return communityRolesCommand
}

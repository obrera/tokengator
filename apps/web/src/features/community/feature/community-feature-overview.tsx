import { Link } from '@tanstack/react-router'
import type { CommunityGetBySlugResult } from '@tokengator/sdk'

import { getAssetGroupResolverKindShortLabel } from '@/features/asset-group/util/asset-group-resolver-kind'

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@tokengator/ui/components/accordion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tokengator/ui/components/card'

import { useCommunityBySlugQuery } from '../data-access/use-community-by-slug-query'
import { CommunityFeatureAssetMarketplace } from './community-feature-asset-marketplace'

type CommunityOverviewAssetGroup = CommunityGetBySlugResult['roles'][number]['assetGroups'][number]
type CommunityOverviewAssetMarketplace = CommunityGetBySlugResult['roles'][number]['assetMarketplace']
type CommunityOverviewRole = CommunityGetBySlugResult['roles'][number]

const assetGroupResolverKindOrder = {
  'helius-collection-assets': 2,
  'helius-token-accounts': 0,
  'realms-voters': 1,
} as const satisfies Record<CommunityOverviewAssetGroup['resolverKind'], number>

function compareCommunityOverviewAssetGroups(left: CommunityOverviewAssetGroup, right: CommunityOverviewAssetGroup) {
  return (
    left.label.localeCompare(right.label) ||
    left.address.localeCompare(right.address) ||
    left.id.localeCompare(right.id)
  )
}

function compareCommunityOverviewAssignedRoleAssetGroups(
  left: { assetGroup: CommunityOverviewAssetGroup; role: CommunityOverviewRole },
  right: { assetGroup: CommunityOverviewAssetGroup; role: CommunityOverviewRole },
) {
  return (
    assetGroupResolverKindOrder[left.assetGroup.resolverKind] -
      assetGroupResolverKindOrder[right.assetGroup.resolverKind] ||
    left.assetGroup.label.localeCompare(right.assetGroup.label) ||
    left.role.name.localeCompare(right.role.name) ||
    left.role.slug.localeCompare(right.role.slug) ||
    left.role.id.localeCompare(right.role.id) ||
    left.assetGroup.address.localeCompare(right.assetGroup.address) ||
    left.assetGroup.id.localeCompare(right.assetGroup.id)
  )
}

function formatRequirement(assetGroup: CommunityOverviewAssetGroup) {
  const amountRange = assetGroup.maximumAmount
    ? `Min ${assetGroup.minimumAmount} & Max ${assetGroup.maximumAmount}`
    : `Min ${assetGroup.minimumAmount}+`

  return `Requirement: ${amountRange}`
}

function getCommunityOverviewAssetGroups(roles: CommunityOverviewRole[]) {
  const assetGroupsById = new Map<string, CommunityOverviewAssetGroup>()

  for (const role of roles) {
    for (const assetGroup of role.assetGroups) {
      assetGroupsById.set(assetGroup.id, assetGroup)
    }
  }

  return [...assetGroupsById.values()].sort(compareCommunityOverviewAssetGroups)
}

function getCommunityOverviewAssetMarketplaces(roles: CommunityOverviewRole[]) {
  const assetMarketplacesByAssetGroupId = new Map<string, CommunityOverviewAssetMarketplace>()

  for (const role of roles) {
    if (role.assetMarketplace.enabled && role.assetMarketplace.assetGroupId) {
      assetMarketplacesByAssetGroupId.set(role.assetMarketplace.assetGroupId, role.assetMarketplace)
    }
  }

  return assetMarketplacesByAssetGroupId
}

function getCommunityOverviewAssignedRoleAssetGroups(roles: CommunityOverviewRole[]) {
  return roles
    .filter((role) => role.assigned)
    .flatMap((role) => role.assignedAssetGroups.map((assetGroup) => ({ assetGroup, role })))
    .sort(compareCommunityOverviewAssignedRoleAssetGroups)
}

function getMatchModeLabel(role: CommunityOverviewRole) {
  if (role.assetGroups.length <= 1) {
    return null
  }

  return role.matchMode === 'all' ? 'Requires all requirements' : 'Requires any requirement'
}

function CommunityOverviewAssetGroupImage({ assetGroup }: { assetGroup: CommunityOverviewAssetGroup }) {
  return assetGroup.imageUrl ? (
    <img
      alt={assetGroup.label}
      className="bg-muted size-10 shrink-0 rounded-md border object-cover"
      loading="lazy"
      src={assetGroup.imageUrl}
    />
  ) : (
    <div
      aria-label={`${assetGroup.label} image placeholder`}
      className="bg-muted size-10 shrink-0 rounded-md border"
      role="img"
    />
  )
}

function CommunityOverviewAssetGroupSummary({ assetGroup }: { assetGroup: CommunityOverviewAssetGroup }) {
  return (
    <span className="flex min-w-0 items-center gap-3">
      <CommunityOverviewAssetGroupImage assetGroup={assetGroup} />
      <span className="grid min-w-0 gap-1">
        <span className="truncate font-medium">{assetGroup.label}</span>
        <span className="text-muted-foreground truncate text-xs">
          {getAssetGroupResolverKindShortLabel(assetGroup.resolverKind)} - {assetGroup.address}
        </span>
      </span>
    </span>
  )
}

function CommunityOverviewAssignedRoleRow({
  assetGroup,
  role,
}: {
  assetGroup: CommunityOverviewAssetGroup
  role: CommunityOverviewRole
}) {
  return (
    <div className="grid min-w-0 rounded-md border p-3">
      <span className="flex min-w-0 items-center gap-3">
        <CommunityOverviewAssetGroupImage assetGroup={assetGroup} />
        <span className="grid min-w-0 gap-1">
          <span className="truncate font-medium">
            {getAssetGroupResolverKindShortLabel(assetGroup.resolverKind)}: {assetGroup.label}
          </span>
          <span className="text-muted-foreground truncate text-xs">{role.name}</span>
        </span>
      </span>
    </div>
  )
}

function CommunityOverviewAssetRow({
  assetGroup,
  assetMarketplace,
  marketplace,
  slug,
}: {
  assetGroup: CommunityOverviewAssetGroup
  assetMarketplace: CommunityOverviewAssetMarketplace | null
  marketplace: CommunityGetBySlugResult['marketplace']
  slug: string
}) {
  const content = (
    <>
      <CommunityOverviewAssetGroupSummary assetGroup={assetGroup} />
      <span className="text-muted-foreground shrink-0 text-xs">{assetGroup.type}</span>
    </>
  )

  if (assetGroup.type === 'collection') {
    return (
      <div className="grid min-w-0 gap-3 rounded-md border p-3">
        <Link
          className="hover:bg-muted/60 -m-1 grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md p-1 text-left transition-colors"
          params={{
            address: assetGroup.address,
            slug,
          }}
          search={{
            facets: undefined,
            grid: 8,
            owner: undefined,
            query: undefined,
          }}
          to="/communities/$slug/collections/$address"
        >
          {content}
        </Link>
        <CommunityFeatureAssetMarketplace
          assetGroup={assetGroup}
          assetMarketplace={assetMarketplace}
          marketplace={marketplace}
          slug={slug}
        />
      </div>
    )
  }

  return (
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-md border p-3">
      {content}
    </div>
  )
}

function CommunityOverviewRoleItem({ role }: { role: CommunityOverviewRole }) {
  const matchModeLabel = getMatchModeLabel(role)

  return (
    <AccordionItem value={role.id}>
      <AccordionTrigger className="items-center gap-3 p-3 hover:no-underline">
        <span className="grid min-w-0 gap-1">
          <span className="truncate font-medium">{role.name}</span>
          {matchModeLabel ? <span className="text-muted-foreground truncate text-xs">{matchModeLabel}</span> : null}
        </span>
      </AccordionTrigger>
      <AccordionContent className="grid gap-2 px-3 pb-3">
        {role.assetGroups.map((assetGroup) => (
          <div className="grid gap-2 rounded-md border p-3" key={assetGroup.id}>
            <CommunityOverviewAssetGroupSummary assetGroup={assetGroup} />
            <div className="text-muted-foreground text-xs">{formatRequirement(assetGroup)}</div>
          </div>
        ))}
      </AccordionContent>
    </AccordionItem>
  )
}

export function CommunityFeatureOverview({ initialCommunity }: { initialCommunity: CommunityGetBySlugResult }) {
  const { data } = useCommunityBySlugQuery(initialCommunity.slug, {
    initialData: initialCommunity,
  })

  if (!data) {
    return null
  }

  const assignedRoleAssetGroups = getCommunityOverviewAssignedRoleAssetGroups(data.roles)
  const assignedRoles = data.roles.filter((role) => role.assigned)
  const assetGroups = getCommunityOverviewAssetGroups(data.roles)
  const assetMarketplacesByAssetGroupId = getCommunityOverviewAssetMarketplaces(data.roles)
  const availableRoles = data.roles.filter((role) => !role.assigned)

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <Card>
        <CardHeader>
          <CardTitle>Assigned</CardTitle>
          <CardDescription>{assignedRoles.length} assigned</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {assignedRoleAssetGroups.length ? (
            assignedRoleAssetGroups.map(({ assetGroup, role }) => (
              <CommunityOverviewAssignedRoleRow
                assetGroup={assetGroup}
                key={`${role.id}:${assetGroup.id}`}
                role={role}
              />
            ))
          ) : (
            <p className="text-muted-foreground text-sm">No assigned roles yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Available</CardTitle>
          <CardDescription>{availableRoles.length} available</CardDescription>
        </CardHeader>
        <CardContent>
          {availableRoles.length ? (
            <Accordion defaultValue={[]} multiple>
              {availableRoles.map((role) => (
                <CommunityOverviewRoleItem key={role.id} role={role} />
              ))}
            </Accordion>
          ) : (
            <p className="text-muted-foreground text-sm">No available roles yet.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assets</CardTitle>
          <CardDescription>{assetGroups.length} linked</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3">
          {assetGroups.length ? (
            assetGroups.map((assetGroup) => (
              <CommunityOverviewAssetRow
                assetGroup={assetGroup}
                assetMarketplace={assetMarketplacesByAssetGroupId.get(assetGroup.id) ?? null}
                key={assetGroup.id}
                marketplace={data.marketplace}
                slug={data.slug}
              />
            ))
          ) : (
            <p className="text-muted-foreground text-sm">No token-gated assets yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

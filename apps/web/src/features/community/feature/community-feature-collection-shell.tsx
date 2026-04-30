import type { ReactNode } from 'react'
import { Link, useLocation, useNavigate } from '@tanstack/react-router'
import type { CommunityCollectionEntity, CommunityGetBySlugResult } from '@tokengator/sdk'

import { Card, CardHeader } from '@tokengator/ui/components/card'
import { Tabs, TabsList, TabsTrigger } from '@tokengator/ui/components/tabs'

import type { CommunityCollectionAssetSearch } from '../util/community-collection-asset-search'
import { CommunityUiCollectionCombobox } from '../ui/community-ui-collection-combobox'

export type CommunityCollectionTab = 'assets' | 'insights' | 'leaderboard'

const communityCollectionTabs = [
  {
    label: 'Assets',
    to: '/communities/$slug/collections/$address',
    value: 'assets',
  },
  {
    label: 'Insights',
    to: '/communities/$slug/collections/$address/insights',
    value: 'insights',
  },
  {
    label: 'Leaderboard',
    to: '/communities/$slug/collections/$address/leaderboard',
    value: 'leaderboard',
  },
] as const

function getCommunityCollectionTabTo(tab: CommunityCollectionTab) {
  return communityCollectionTabs.find((currentTab) => currentTab.value === tab)?.to ?? communityCollectionTabs[0].to
}

function getCommunityCollectionTabSearch(args: {
  search: CommunityCollectionAssetSearch
  tab: CommunityCollectionTab
}) {
  if (args.tab === 'assets') {
    return args.search
  }

  return {
    facets: undefined,
    grid: args.search.grid,
    owner: undefined,
    query: undefined,
  }
}

export function getCommunityCollectionCurrentTab(pathname: string): CommunityCollectionTab {
  const normalizedPathname = pathname.replace(/\/+$/, '')
  const segments = normalizedPathname.split('/').filter(Boolean)
  const tabSegment = segments[2] === 'collections' ? segments[4] : undefined

  if (tabSegment === 'insights') {
    return 'insights'
  }

  if (tabSegment === 'leaderboard') {
    return 'leaderboard'
  }

  return 'assets'
}

export function getCommunityCollectionSwitchNavigation(args: {
  address: string
  search: CommunityCollectionAssetSearch
  slug: string
  tab: CommunityCollectionTab
}) {
  return {
    params: {
      address: args.address,
      slug: args.slug,
    },
    search: {
      facets: undefined,
      grid: args.search.grid,
      owner: args.tab === 'assets' ? args.search.owner : undefined,
      query: undefined,
    },
    to: getCommunityCollectionTabTo(args.tab),
  }
}

export function CommunityFeatureCollectionShell({
  children,
  collections,
  search,
  selectedCollection,
  slug,
}: {
  children: ReactNode
  collections: CommunityGetBySlugResult['collections']
  search: CommunityCollectionAssetSearch
  selectedCollection: CommunityCollectionEntity
  slug: string
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const currentTab = getCommunityCollectionCurrentTab(location.pathname)

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader className="gap-4">
          <CommunityUiCollectionCombobox
            collections={collections}
            onCollectionChange={(address) => {
              void navigate(
                getCommunityCollectionSwitchNavigation({
                  address,
                  search,
                  slug,
                  tab: currentTab,
                }),
              )
            }}
            selectedCollectionAddress={selectedCollection.address}
          />
          <Tabs value={currentTab}>
            <TabsList className="justify-start gap-8 p-0" variant="line">
              {communityCollectionTabs.map((tab) => (
                <TabsTrigger
                  className="flex-none rounded-none px-0 py-2 text-xs font-semibold uppercase data-active:after:shadow-[0_7px_14px_1px_color-mix(in_oklch,var(--foreground)_35%,transparent)]"
                  key={tab.value}
                  nativeButton={false}
                  render={
                    <Link
                      params={{
                        address: selectedCollection.address,
                        slug,
                      }}
                      search={getCommunityCollectionTabSearch({ search, tab: tab.value })}
                      to={tab.to}
                    />
                  }
                  value={tab.value}
                >
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardHeader>
      </Card>
      {children}
    </div>
  )
}

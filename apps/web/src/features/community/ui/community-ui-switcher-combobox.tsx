import { ChevronsUpDown, LayoutGrid } from 'lucide-react'
import type { CommunityEntity } from '@tokengator/sdk'

import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
  ComboboxTrigger,
  ComboboxValue,
} from '@tokengator/ui/components/combobox'

import { CommunityUiAvatar } from './community-ui-avatar'

interface CommunityUiSwitcherComboboxProps {
  communities: CommunityEntity[]
  onAllCommunitiesSelect: () => void
  onCommunitySelect: (slug: string) => void
  selectedCommunity: CommunityEntity
}

type CommunitySwitcherOption = CommunityEntity & {
  type: 'all' | 'community'
}

const allCommunitiesOption: CommunitySwitcherOption = {
  id: 'all-communities',
  logo: null,
  name: 'All communities',
  slug: 'all-communities',
  type: 'all',
}

function toCommunityOption(community: CommunityEntity): CommunitySwitcherOption {
  return {
    ...community,
    type: 'community',
  }
}

export function getCommunitySwitcherOptions(communities: CommunityEntity[]): CommunitySwitcherOption[] {
  return [
    ...[...communities]
      .sort(
        (left, right) =>
          left.name.localeCompare(right.name) || left.slug.localeCompare(right.slug) || left.id.localeCompare(right.id),
      )
      .map(toCommunityOption),
    allCommunitiesOption,
  ]
}

function CommunityUiSwitcherComboboxAllOption() {
  return (
    <span className="flex min-w-0 items-center gap-3 leading-none">
      <div
        aria-hidden
        className="bg-muted text-muted-foreground flex size-10 shrink-0 items-center justify-center rounded-full"
      >
        <LayoutGrid className="size-4" />
      </div>
      <span className="truncate text-sm font-medium">All communities</span>
    </span>
  )
}

function CommunityUiSwitcherComboboxCommunityOption({
  community,
  variant = 'item',
}: {
  community: CommunityEntity
  variant?: 'header' | 'item'
}) {
  return (
    <span className="flex min-w-0 items-center gap-3 leading-none">
      <CommunityUiAvatar community={community} />
      <div className="grid min-w-0 gap-0.5">
        <span
          className={
            variant === 'header' ? 'font-heading truncate text-lg leading-none' : 'truncate text-sm font-medium'
          }
        >
          {community.name}
        </span>
        <span className="text-muted-foreground truncate text-xs leading-none">@{community.slug}</span>
      </div>
    </span>
  )
}

export function CommunityUiSwitcherCombobox({
  communities,
  onAllCommunitiesSelect,
  onCommunitySelect,
  selectedCommunity,
}: CommunityUiSwitcherComboboxProps) {
  const options = getCommunitySwitcherOptions(communities)
  const selectedOption: CommunitySwitcherOption | null =
    options.find((option) => option.type === 'community' && option.slug === selectedCommunity.slug) ?? null

  return (
    <div className="flex w-fit max-w-full leading-none">
      <Combobox
        items={options}
        itemToStringLabel={(option) => option.name}
        itemToStringValue={(option) => option.slug}
        onValueChange={(option) => {
          if (!option) {
            return
          }

          if (option.type === 'all') {
            onAllCommunitiesSelect()
            return
          }

          if (option.slug !== selectedCommunity.slug) {
            onCommunitySelect(option.slug)
          }
        }}
        value={selectedOption}
      >
        <ComboboxTrigger
          aria-label="Select community"
          className="focus-visible:border-ring focus-visible:ring-ring/50 flex h-auto min-h-10 max-w-full items-center gap-3 rounded-md border border-transparent bg-transparent px-0 py-0 text-left leading-none transition-[color,box-shadow] outline-none focus-visible:ring-[3px] [&>svg:last-child]:hidden"
        >
          <div className="flex min-w-0 [&_[data-slot=combobox-value]]:block">
            <ComboboxValue>
              {() => <CommunityUiSwitcherComboboxCommunityOption community={selectedCommunity} variant="header" />}
            </ComboboxValue>
          </div>
          <ChevronsUpDown className="text-muted-foreground size-4 shrink-0 translate-y-0.5" />
        </ComboboxTrigger>
        <ComboboxContent className="w-80 max-w-[calc(100vw-2rem)] sm:w-96">
          <div className="p-1">
            <ComboboxInput
              aria-label="Search communities"
              className="w-full"
              placeholder="Search communities..."
              showClear
              showTrigger={false}
            />
          </div>
          <ComboboxEmpty>No communities found.</ComboboxEmpty>
          <ComboboxList>
            {(option: CommunitySwitcherOption) => (
              <ComboboxItem className="items-center py-2 pr-8" key={option.id} value={option}>
                {option.type === 'all' ? (
                  <CommunityUiSwitcherComboboxAllOption />
                ) : (
                  <CommunityUiSwitcherComboboxCommunityOption community={option} />
                )}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
    </div>
  )
}

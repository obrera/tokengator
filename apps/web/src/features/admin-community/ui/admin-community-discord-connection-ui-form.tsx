import { Loader2 } from 'lucide-react'
import { type SubmitEvent, useEffect, useState } from 'react'
import { Button } from '@tokengator/ui/components/button'
import { Label } from '@tokengator/ui/components/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@tokengator/ui/components/select'

export interface AdminCommunityDiscordConnectionUiFormGuildOption {
  assignedCommunityName: string | null
  disabled: boolean
  id: string
  name: string
}

interface AdminCommunityDiscordConnectionUiFormProps {
  guildOptions: AdminCommunityDiscordConnectionUiFormGuildOption[]
  initialGuildId: string
  isGuildOptionsError: boolean
  isGuildOptionsPending: boolean
  isPending: boolean
  onSubmit: (guildId: string) => Promise<boolean>
}

const selectGuildValue = '__select-guild__'

export function AdminCommunityDiscordConnectionUiForm(props: AdminCommunityDiscordConnectionUiFormProps) {
  const { guildOptions, initialGuildId, isGuildOptionsError, isGuildOptionsPending, isPending, onSubmit } = props
  const [guildId, setGuildId] = useState(initialGuildId)
  const guildItems = [
    {
      label: 'Select a Discord server',
      value: selectGuildValue,
    },
    ...guildOptions.map((option) => ({
      label: option.name,
      value: option.id,
    })),
  ]
  const selectedGuild = guildOptions.find((option) => option.id === guildId) ?? null

  useEffect(() => {
    setGuildId(initialGuildId)
  }, [initialGuildId])

  const canSubmit = Boolean(guildId.trim()) && !selectedGuild?.disabled
  const helperText = isGuildOptionsError
    ? 'Discord server list unavailable.'
    : isGuildOptionsPending
      ? 'Loading Discord servers.'
      : guildOptions.length
        ? 'Servers already connected to a community are disabled.'
        : 'No Discord servers found for the bot.'

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canSubmit) {
      return
    }

    await onSubmit(guildId)
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-1.5">
        <Label id="organization-discord-guild-id-label">Discord Server</Label>
        <Select
          disabled={isGuildOptionsError || isGuildOptionsPending || isPending}
          items={guildItems}
          onValueChange={(value) => {
            if (value === null || value === selectGuildValue) {
              setGuildId('')
              return
            }

            setGuildId(value)
          }}
          value={guildId || selectGuildValue}
        >
          <SelectTrigger
            aria-labelledby="organization-discord-guild-id-label"
            className="w-full"
            id="organization-discord-guild-id"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem disabled value={selectGuildValue}>
              Select a Discord server
            </SelectItem>
            {guildOptions.map((option) => (
              <SelectItem disabled={option.disabled} key={option.id} value={option.id}>
                <span className="flex min-w-0 flex-col">
                  <span className="truncate">{option.name}</span>
                  <span className="text-muted-foreground truncate font-mono text-[11px]">{option.id}</span>
                </span>
                {option.assignedCommunityName ? (
                  <span className="text-muted-foreground ml-auto shrink-0">
                    Assigned to {option.assignedCommunityName}
                  </span>
                ) : null}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-muted-foreground text-xs">{helperText}</p>
      </div>
      <div className="flex justify-end">
        <Button disabled={isPending || !canSubmit} type="submit">
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving
            </>
          ) : (
            'Save Server'
          )}
        </Button>
      </div>
    </form>
  )
}

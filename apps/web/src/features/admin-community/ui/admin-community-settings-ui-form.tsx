import { Loader2 } from 'lucide-react'
import { type SubmitEvent, useEffect, useState } from 'react'
import { Button } from '@tokengator/ui/components/button'
import { Input } from '@tokengator/ui/components/input'
import { Label } from '@tokengator/ui/components/label'
import { Textarea } from '@tokengator/ui/components/textarea'

const communityDescriptionMaxLength = 256

export interface AdminCommunitySettingsUiFormValues {
  description: string
  discordUrl: string
  githubUrl: string
  logo: string
  name: string
  slug: string
  telegramUrl: string
  websiteUrl: string
  xUrl: string
}

interface AdminCommunitySettingsUiFormProps {
  initialValues: AdminCommunitySettingsUiFormValues
  isPending: boolean
  onSubmit: (values: AdminCommunitySettingsUiFormValues) => Promise<boolean>
}

export function AdminCommunitySettingsUiForm(props: AdminCommunitySettingsUiFormProps) {
  const { initialValues, isPending, onSubmit } = props
  const [formValues, setFormValues] = useState(initialValues)

  useEffect(() => {
    setFormValues(initialValues)
  }, [
    initialValues.description,
    initialValues.discordUrl,
    initialValues.githubUrl,
    initialValues.logo,
    initialValues.name,
    initialValues.slug,
    initialValues.telegramUrl,
    initialValues.websiteUrl,
    initialValues.xUrl,
  ])

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    await onSubmit(formValues)
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
      <div className="grid gap-1.5">
        <Label htmlFor="organization-detail-name">Name</Label>
        <Input
          id="organization-detail-name"
          onChange={(event) =>
            setFormValues((currentValues) => ({
              ...currentValues,
              name: event.target.value,
            }))
          }
          required
          value={formValues.name}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="organization-detail-slug">Slug</Label>
        <Input
          id="organization-detail-slug"
          onChange={(event) =>
            setFormValues((currentValues) => ({
              ...currentValues,
              slug: event.target.value,
            }))
          }
          required
          value={formValues.slug}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="organization-detail-logo">Logo URL</Label>
        <Input
          id="organization-detail-logo"
          onChange={(event) =>
            setFormValues((currentValues) => ({
              ...currentValues,
              logo: event.target.value,
            }))
          }
          value={formValues.logo}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="organization-detail-description">Description</Label>
        <Textarea
          id="organization-detail-description"
          maxLength={communityDescriptionMaxLength}
          onChange={(event) =>
            setFormValues((currentValues) => ({
              ...currentValues,
              description: event.target.value,
            }))
          }
          rows={3}
          value={formValues.description}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="organization-detail-discord-url">Discord URL</Label>
        <Input
          id="organization-detail-discord-url"
          onChange={(event) =>
            setFormValues((currentValues) => ({
              ...currentValues,
              discordUrl: event.target.value,
            }))
          }
          placeholder="https://discord.gg/example"
          type="url"
          value={formValues.discordUrl}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="organization-detail-github-url">GitHub URL</Label>
        <Input
          id="organization-detail-github-url"
          onChange={(event) =>
            setFormValues((currentValues) => ({
              ...currentValues,
              githubUrl: event.target.value,
            }))
          }
          placeholder="https://github.com/example"
          type="url"
          value={formValues.githubUrl}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="organization-detail-telegram-url">Telegram URL</Label>
        <Input
          id="organization-detail-telegram-url"
          onChange={(event) =>
            setFormValues((currentValues) => ({
              ...currentValues,
              telegramUrl: event.target.value,
            }))
          }
          placeholder="https://t.me/example"
          type="url"
          value={formValues.telegramUrl}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="organization-detail-website-url">Website URL</Label>
        <Input
          id="organization-detail-website-url"
          onChange={(event) =>
            setFormValues((currentValues) => ({
              ...currentValues,
              websiteUrl: event.target.value,
            }))
          }
          placeholder="https://example.com"
          type="url"
          value={formValues.websiteUrl}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="organization-detail-x-url">X URL</Label>
        <Input
          id="organization-detail-x-url"
          onChange={(event) =>
            setFormValues((currentValues) => ({
              ...currentValues,
              xUrl: event.target.value,
            }))
          }
          placeholder="https://x.com/example"
          type="url"
          value={formValues.xUrl}
        />
      </div>
      <div className="flex justify-end">
        <Button disabled={isPending} type="submit">
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Saving
            </>
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </form>
  )
}

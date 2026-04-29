import type { AdminOrganizationDetailEntity } from '@tokengator/sdk'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tokengator/ui/components/card'

import { useAdminCommunityUpdate } from '../data-access/use-admin-community-update'
import {
  AdminCommunitySettingsUiForm,
  type AdminCommunitySettingsUiFormValues,
} from '../ui/admin-community-settings-ui-form'

interface AdminCommunityFeatureSettingsProps {
  organization: AdminOrganizationDetailEntity
}

export function AdminCommunityFeatureSettings(props: AdminCommunityFeatureSettingsProps) {
  const { organization } = props
  const updateCommunity = useAdminCommunityUpdate()

  async function handleSaveCommunity(values: AdminCommunitySettingsUiFormValues) {
    try {
      await updateCommunity.mutateAsync({
        data: {
          description: values.description,
          discordUrl: values.discordUrl,
          githubUrl: values.githubUrl,
          logo: values.logo || undefined,
          name: values.name,
          slug: values.slug,
          telegramUrl: values.telegramUrl,
          websiteUrl: values.websiteUrl,
          xUrl: values.xUrl,
        },
        organizationId: organization.id,
      })

      return true
    } catch {
      return false
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Community Details</CardTitle>
        <CardDescription>Edit the community details.</CardDescription>
      </CardHeader>
      <CardContent>
        <AdminCommunitySettingsUiForm
          initialValues={{
            description: organization.description ?? '',
            discordUrl: organization.discordUrl ?? '',
            githubUrl: organization.githubUrl ?? '',
            logo: organization.logo ?? '',
            name: organization.name,
            slug: organization.slug,
            telegramUrl: organization.telegramUrl ?? '',
            websiteUrl: organization.websiteUrl ?? '',
            xUrl: organization.xUrl ?? '',
          }}
          isPending={updateCommunity.isPending}
          onSubmit={handleSaveCommunity}
        />
      </CardContent>
    </Card>
  )
}

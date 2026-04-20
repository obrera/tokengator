import { createFileRoute } from '@tanstack/react-router'

import { DevFeatureBackup } from '@/features/dev/feature/dev-feature-backup'

export const Route = createFileRoute('/dev/backup')({
  component: RouteComponent,
})

function RouteComponent() {
  return <DevFeatureBackup />
}

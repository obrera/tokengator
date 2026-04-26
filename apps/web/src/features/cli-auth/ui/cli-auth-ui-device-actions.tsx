import { Button } from '@tokengator/ui/components/button'

export function CliAuthUiDeviceActions({
  approveDevice,
  denyDevice,
  isDisabled,
}: {
  approveDevice: () => void
  denyDevice: () => void
  isDisabled: boolean
}) {
  return (
    <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
      <Button disabled={isDisabled} onClick={denyDevice} type="button" variant="outline">
        Deny
      </Button>
      <Button disabled={isDisabled} onClick={approveDevice} type="button">
        Approve
      </Button>
    </div>
  )
}

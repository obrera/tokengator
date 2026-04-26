export function CliAuthUiDeviceDetails({ accountLabel, userCode }: { accountLabel: string; userCode: string }) {
  return (
    <dl className="grid gap-3 text-sm">
      <div className="flex items-center justify-between gap-4">
        <dt className="text-muted-foreground">Device</dt>
        <dd className="font-medium">Tokengator CLI</dd>
      </div>
      <div className="flex items-center justify-between gap-4">
        <dt className="text-muted-foreground">Scope</dt>
        <dd className="font-medium">cli</dd>
      </div>
      <div className="flex items-center justify-between gap-4">
        <dt className="text-muted-foreground">Code</dt>
        <dd className="font-mono text-base font-semibold">{userCode}</dd>
      </div>
      <div className="flex items-center justify-between gap-4">
        <dt className="text-muted-foreground">Account</dt>
        <dd className="truncate font-medium">{accountLabel}</dd>
      </div>
    </dl>
  )
}

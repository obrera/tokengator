import { Button } from '@tokengator/ui/components/button'

export function CliAuthUiVerificationError({
  error,
  tryDifferentCode,
}: {
  error: string
  tryDifferentCode?: () => void
}) {
  return (
    <div className="space-y-3">
      <p className="text-destructive text-sm">{error}</p>
      {tryDifferentCode ? (
        <Button onClick={tryDifferentCode} type="button" variant="outline">
          Try a different code
        </Button>
      ) : null}
    </div>
  )
}

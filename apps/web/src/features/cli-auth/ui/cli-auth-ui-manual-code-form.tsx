import type { SubmitEvent } from 'react'
import { useState } from 'react'
import { Button } from '@tokengator/ui/components/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@tokengator/ui/components/card'
import { Input } from '@tokengator/ui/components/input'
import { Label } from '@tokengator/ui/components/label'

import { normalizeCliAuthUserCode } from '../util/cli-auth-user-code'

export function CliAuthUiManualCodeForm({
  initialUserCode,
  submitUserCode,
}: {
  initialUserCode?: string
  submitUserCode: (userCode: string) => void
}) {
  const [draftUserCode, setDraftUserCode] = useState(initialUserCode ?? '')
  const [manualEntryError, setManualEntryError] = useState<string | null>(null)

  function handleUserCodeChange(value: string) {
    setDraftUserCode(value)
    setManualEntryError(null)
  }

  function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()

    const normalizedUserCode = normalizeCliAuthUserCode(draftUserCode)

    if (!normalizedUserCode) {
      setManualEntryError('Enter the code shown in your terminal.')
      return
    }

    submitUserCode(normalizedUserCode)
  }

  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Authorize CLI</CardTitle>
          <CardDescription>Enter the code shown by Tokengator CLI.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="cli-user-code">Code</Label>
              <Input
                autoComplete="one-time-code"
                id="cli-user-code"
                onInput={(event) => handleUserCodeChange(event.currentTarget.value)}
                value={draftUserCode}
              />
            </div>
            {manualEntryError ? <p className="text-destructive text-sm">{manualEntryError}</p> : null}
            <Button className="w-full" type="submit">
              Continue
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

import { Card, CardDescription, CardHeader, CardTitle } from '@tokengator/ui/components/card'

export function CliAuthUiFinalState({ state }: { state: 'approved' | 'denied' }) {
  return (
    <div className="flex min-h-full items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>{state === 'approved' ? 'CLI Access Approved' : 'CLI Access Denied'}</CardTitle>
          <CardDescription>Return to your terminal to continue.</CardDescription>
        </CardHeader>
      </Card>
    </div>
  )
}

import { useNavigate } from '@tanstack/react-router'

import { CliAuthUiManualCodeForm } from '../ui/cli-auth-ui-manual-code-form'

export function CliAuthFeatureManualCodeEntry({ initialUserCode }: { initialUserCode?: string }) {
  const navigate = useNavigate({ from: '/cli/authorize' })

  function submitUserCode(userCode: string) {
    void navigate({
      replace: true,
      search: {
        user_code: userCode,
      },
      to: '/cli/authorize',
    })
  }

  return <CliAuthUiManualCodeForm initialUserCode={initialUserCode} submitUserCode={submitUserCode} />
}

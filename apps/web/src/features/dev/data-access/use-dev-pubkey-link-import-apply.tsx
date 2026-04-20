import { useMutation } from '@tanstack/react-query'

import { orpc } from '@/lib/orpc'

export function useDevPubkeyLinkImportApply() {
  return useMutation(orpc.dev.pubkeyLinkImportApply.mutationOptions())
}

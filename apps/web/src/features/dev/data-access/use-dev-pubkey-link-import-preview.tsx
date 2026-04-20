import { useMutation } from '@tanstack/react-query'

import { orpc } from '@/lib/orpc'

export function useDevPubkeyLinkImportPreview() {
  return useMutation(orpc.dev.pubkeyLinkImportPreview.mutationOptions())
}

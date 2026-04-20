import { devFeatureEcho } from './dev-feature-echo'
import { devFeaturePubkeyLinkImportApply } from './dev-feature-pubkey-link-import-apply'
import { devFeaturePubkeyLinkImportPreview } from './dev-feature-pubkey-link-import-preview'
import { devFeatureUptime } from './dev-feature-uptime'

export const devRouter = {
  echo: devFeatureEcho,
  pubkeyLinkImportApply: devFeaturePubkeyLinkImportApply,
  pubkeyLinkImportPreview: devFeaturePubkeyLinkImportPreview,
  uptime: devFeatureUptime,
}

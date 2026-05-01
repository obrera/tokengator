import { coreFeatureAppConfig } from './core-feature-app-config'
import { coreFeatureHealthCheck } from './core-feature-health-check'
import { coreFeatureStatus } from './core-feature-status'

export const coreRouter = {
  appConfig: coreFeatureAppConfig,
  healthCheck: coreFeatureHealthCheck,
  status: coreFeatureStatus,
}

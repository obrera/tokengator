import { publicProcedure } from '../../../lib/procedures'
import { getCoreStatus } from '../data-access/get-core-status'

export const coreFeatureStatus = publicProcedure.handler(() => getCoreStatus())

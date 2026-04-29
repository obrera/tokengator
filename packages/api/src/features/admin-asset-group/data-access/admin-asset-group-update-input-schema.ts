import z from 'zod'

import {
  adminAssetGroupResolverKindSchema,
  isAdminAssetGroupResolverKindCompatible,
} from './admin-asset-group-resolver-kind'
import { adminAssetGroupTypeSchema } from './admin-asset-group-type'

const decimalsSchema = z.number().int().min(0).max(255).optional()

export const adminAssetGroupUpdateInputSchema = z.object({
  assetGroupId: z.string().min(1),
  data: z
    .object({
      address: z.string().trim().min(1),
      decimals: decimalsSchema,
      enabled: z.boolean(),
      imageUrl: z.string().trim().nullable().optional(),
      label: z.string().trim().min(1),
      resolverKind: adminAssetGroupResolverKindSchema.optional(),
      symbol: z.string().trim().nullable().optional(),
      symbolMagicEden: z.string().trim().nullable().optional(),
      type: adminAssetGroupTypeSchema,
    })
    .superRefine((input, ctx) => {
      if (
        !input.resolverKind ||
        isAdminAssetGroupResolverKindCompatible({ resolverKind: input.resolverKind, type: input.type })
      ) {
        return
      }

      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Resolver kind is incompatible with the asset group type.',
        path: ['resolverKind'],
      })
    }),
})

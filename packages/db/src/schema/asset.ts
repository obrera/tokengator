import { relations, sql } from 'drizzle-orm'
import { index, integer, sqliteTable, text, uniqueIndex } from 'drizzle-orm/sqlite-core'

export const assetGroup = sqliteTable(
  'asset_group',
  {
    address: text('address').notNull(),
    createdAt: integer('created_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .notNull(),
    decimals: integer('decimals').default(0).notNull(),
    enabled: integer('enabled', { mode: 'boolean' }).default(true).notNull(),
    facetTotals: text('facet_totals'),
    id: text('id')
      .$defaultFn(() => crypto.randomUUID())
      .primaryKey(),
    imageUrl: text('image_url'),
    indexingStartedAt: integer('indexing_started_at', { mode: 'timestamp_ms' }),
    label: text('label').notNull(),
    resolverKind: text('resolver_kind', {
      enum: ['helius-collection-assets', 'helius-token-accounts', 'realms-voters'],
    }).notNull(),
    symbol: text('symbol'),
    symbolMagicEden: text('symbol_magic_eden'),
    type: text('type', { enum: ['collection', 'mint'] }).notNull(),
    updatedAt: integer('updated_at', { mode: 'timestamp_ms' })
      .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [
    index('asset_group_address_idx').on(table.address),
    index('asset_group_createdAt_idx').on(table.createdAt),
    index('asset_group_enabled_idx').on(table.enabled),
    index('asset_group_label_idx').on(table.label),
    index('asset_group_resolverKind_idx').on(table.resolverKind),
    index('asset_group_type_idx').on(table.type),
  ],
)

export const assetGroupIndexRun = sqliteTable(
  'asset_group_index_run',
  {
    assetGroupId: text('asset_group_id')
      .notNull()
      .references(() => assetGroup.id, { onDelete: 'cascade' }),
    deletedCount: integer('deleted_count').default(0).notNull(),
    errorMessage: text('error_message'),
    errorPayload: text('error_payload'),
    finishedAt: integer('finished_at', { mode: 'timestamp_ms' }),
    id: text('id')
      .$defaultFn(() => crypto.randomUUID())
      .primaryKey(),
    insertedCount: integer('inserted_count').default(0).notNull(),
    pagesProcessed: integer('pages_processed').default(0).notNull(),
    resolverKind: text('resolver_kind', {
      enum: ['helius-collection-assets', 'helius-token-accounts', 'realms-voters'],
    }).notNull(),
    startedAt: integer('started_at', { mode: 'timestamp_ms' }).notNull(),
    status: text('status', { enum: ['failed', 'running', 'skipped', 'succeeded'] }).notNull(),
    totalCount: integer('total_count').default(0).notNull(),
    triggerSource: text('trigger_source', { enum: ['manual', 'scheduled'] }).notNull(),
    updatedCount: integer('updated_count').default(0).notNull(),
  },
  (table) => [
    index('asset_group_index_run_assetGroupId_startedAt_idx').on(table.assetGroupId, table.startedAt),
    index('asset_group_index_run_assetGroupId_status_startedAt_idx').on(
      table.assetGroupId,
      table.status,
      table.startedAt,
    ),
  ],
)

export const asset = sqliteTable(
  'asset',
  {
    address: text('address').notNull(),
    amount: text('amount').notNull(),
    assetGroupId: text('asset_group_id')
      .notNull()
      .references(() => assetGroup.id, { onDelete: 'cascade' }),
    firstSeenAt: integer('first_seen_at', { mode: 'timestamp_ms' }).notNull(),
    id: text('id')
      .$defaultFn(() => crypto.randomUUID())
      .primaryKey(),
    indexedAssetId: text('indexed_asset_id').notNull(),
    indexedAt: integer('indexed_at', { mode: 'timestamp_ms' }).notNull(),
    lastSeenAt: integer('last_seen_at', { mode: 'timestamp_ms' }).notNull(),
    metadata: text('metadata'),
    metadataDescription: text('metadata_description'),
    metadataImageUrl: text('metadata_image_url'),
    metadataJson: text('metadata_json'),
    metadataJsonUrl: text('metadata_json_url'),
    metadataName: text('metadata_name'),
    metadataProgramAccount: text('metadata_program_account'),
    metadataSymbol: text('metadata_symbol'),
    owner: text('owner').notNull(),
    page: integer('page').notNull(),
    raw: text('raw'),
    resolverId: text('resolver_id').notNull(),
    resolverKind: text('resolver_kind', {
      enum: ['helius-collection-assets', 'helius-token-accounts', 'realms-voters'],
    }).notNull(),
    traits: text('traits'),
  },
  (table) => [
    index('asset_assetGroupId_address_idx').on(table.assetGroupId, table.address),
    index('asset_assetGroupId_idx').on(table.assetGroupId),
    index('asset_assetGroupId_indexedAt_idx').on(table.assetGroupId, table.indexedAt),
    index('asset_assetGroupId_owner_idx').on(table.assetGroupId, table.owner),
    index('asset_assetGroupId_resolverKind_idx').on(table.assetGroupId, table.resolverKind),
    uniqueIndex('asset_indexedAssetId_idx').on(table.indexedAssetId),
  ],
)

export const assetTraitGroup = sqliteTable(
  'asset_trait_group',
  {
    assetGroupId: text('asset_group_id')
      .notNull()
      .references(() => assetGroup.id, { onDelete: 'cascade' }),
    id: text('id')
      .$defaultFn(() => crypto.randomUUID())
      .primaryKey(),
    label: text('label').notNull(),
    value: text('value').notNull(),
  },
  (table) => [
    index('asset_trait_group_assetGroupId_idx').on(table.assetGroupId),
    uniqueIndex('asset_trait_group_assetGroupId_value_idx').on(table.assetGroupId, table.value),
  ],
)

export const assetTraitMembership = sqliteTable(
  'asset_trait_membership',
  {
    assetGroupId: text('asset_group_id')
      .notNull()
      .references(() => assetGroup.id, { onDelete: 'cascade' }),
    assetId: text('asset_id')
      .notNull()
      .references(() => asset.id, { onDelete: 'cascade' }),
    valueId: text('value_id')
      .notNull()
      .references(() => assetTraitValue.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('asset_trait_membership_assetGroupId_valueId_assetId_idx').on(
      table.assetGroupId,
      table.valueId,
      table.assetId,
    ),
    index('asset_trait_membership_assetId_idx').on(table.assetId),
    uniqueIndex('asset_trait_membership_assetId_valueId_idx').on(table.assetId, table.valueId),
  ],
)

export const assetTraitValue = sqliteTable(
  'asset_trait_value',
  {
    assetGroupId: text('asset_group_id')
      .notNull()
      .references(() => assetGroup.id, { onDelete: 'cascade' }),
    groupId: text('group_id')
      .notNull()
      .references(() => assetTraitGroup.id, { onDelete: 'cascade' }),
    id: text('id')
      .$defaultFn(() => crypto.randomUUID())
      .primaryKey(),
    label: text('label').notNull(),
    value: text('value').notNull(),
  },
  (table) => [
    index('asset_trait_value_assetGroupId_groupId_idx').on(table.assetGroupId, table.groupId),
    uniqueIndex('asset_trait_value_groupId_value_idx').on(table.groupId, table.value),
  ],
)

export const assetGroupRelations = relations(assetGroup, ({ many }) => ({
  assets: many(asset),
  indexRuns: many(assetGroupIndexRun),
}))

export const assetRelations = relations(asset, ({ one }) => ({
  assetGroup: one(assetGroup, {
    fields: [asset.assetGroupId],
    references: [assetGroup.id],
  }),
}))

export const assetGroupIndexRunRelations = relations(assetGroupIndexRun, ({ one }) => ({
  assetGroup: one(assetGroup, {
    fields: [assetGroupIndexRun.assetGroupId],
    references: [assetGroup.id],
  }),
}))

CREATE TABLE `asset` (
	`address` text NOT NULL,
	`amount` text NOT NULL,
	`asset_group_id` text NOT NULL,
	`first_seen_at` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`indexed_asset_id` text NOT NULL,
	`indexed_at` integer NOT NULL,
	`last_seen_at` integer NOT NULL,
	`metadata` text,
	`metadata_description` text,
	`metadata_image_url` text,
	`metadata_json` text,
	`metadata_json_url` text,
	`metadata_name` text,
	`metadata_program_account` text,
	`metadata_symbol` text,
	`owner` text NOT NULL,
	`page` integer NOT NULL,
	`raw` text,
	`resolver_id` text NOT NULL,
	`resolver_kind` text NOT NULL,
	`traits` text,
	FOREIGN KEY (`asset_group_id`) REFERENCES `asset_group`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `asset_assetGroupId_address_idx` ON `asset` (`asset_group_id`,`address`);--> statement-breakpoint
CREATE INDEX `asset_assetGroupId_idx` ON `asset` (`asset_group_id`);--> statement-breakpoint
CREATE INDEX `asset_assetGroupId_indexedAt_idx` ON `asset` (`asset_group_id`,`indexed_at`);--> statement-breakpoint
CREATE INDEX `asset_assetGroupId_owner_idx` ON `asset` (`asset_group_id`,`owner`);--> statement-breakpoint
CREATE INDEX `asset_assetGroupId_resolverKind_idx` ON `asset` (`asset_group_id`,`resolver_kind`);--> statement-breakpoint
CREATE UNIQUE INDEX `asset_indexedAssetId_idx` ON `asset` (`indexed_asset_id`);--> statement-breakpoint
CREATE TABLE `asset_group` (
	`address` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`decimals` integer DEFAULT 0 NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`facet_totals` text,
	`id` text PRIMARY KEY NOT NULL,
	`image_url` text,
	`indexing_started_at` integer,
	`label` text NOT NULL,
	`resolver_kind` text NOT NULL,
	`symbol` text,
	`symbol_magic_eden` text,
	`type` text NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `asset_group_address_idx` ON `asset_group` (`address`);--> statement-breakpoint
CREATE INDEX `asset_group_createdAt_idx` ON `asset_group` (`created_at`);--> statement-breakpoint
CREATE INDEX `asset_group_enabled_idx` ON `asset_group` (`enabled`);--> statement-breakpoint
CREATE INDEX `asset_group_label_idx` ON `asset_group` (`label`);--> statement-breakpoint
CREATE INDEX `asset_group_resolverKind_idx` ON `asset_group` (`resolver_kind`);--> statement-breakpoint
CREATE INDEX `asset_group_type_idx` ON `asset_group` (`type`);--> statement-breakpoint
CREATE TABLE `asset_group_index_run` (
	`asset_group_id` text NOT NULL,
	`deleted_count` integer DEFAULT 0 NOT NULL,
	`error_message` text,
	`error_payload` text,
	`finished_at` integer,
	`id` text PRIMARY KEY NOT NULL,
	`inserted_count` integer DEFAULT 0 NOT NULL,
	`pages_processed` integer DEFAULT 0 NOT NULL,
	`resolver_kind` text NOT NULL,
	`started_at` integer NOT NULL,
	`status` text NOT NULL,
	`total_count` integer DEFAULT 0 NOT NULL,
	`trigger_source` text NOT NULL,
	`updated_count` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`asset_group_id`) REFERENCES `asset_group`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `asset_group_index_run_assetGroupId_startedAt_idx` ON `asset_group_index_run` (`asset_group_id`,`started_at`);--> statement-breakpoint
CREATE INDEX `asset_group_index_run_assetGroupId_status_startedAt_idx` ON `asset_group_index_run` (`asset_group_id`,`status`,`started_at`);--> statement-breakpoint
CREATE TABLE `asset_trait_group` (
	`asset_group_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`value` text NOT NULL,
	FOREIGN KEY (`asset_group_id`) REFERENCES `asset_group`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `asset_trait_group_assetGroupId_idx` ON `asset_trait_group` (`asset_group_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `asset_trait_group_assetGroupId_value_idx` ON `asset_trait_group` (`asset_group_id`,`value`);--> statement-breakpoint
CREATE TABLE `asset_trait_membership` (
	`asset_group_id` text NOT NULL,
	`asset_id` text NOT NULL,
	`value_id` text NOT NULL,
	FOREIGN KEY (`asset_group_id`) REFERENCES `asset_group`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`asset_id`) REFERENCES `asset`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`value_id`) REFERENCES `asset_trait_value`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `asset_trait_membership_assetGroupId_valueId_assetId_idx` ON `asset_trait_membership` (`asset_group_id`,`value_id`,`asset_id`);--> statement-breakpoint
CREATE INDEX `asset_trait_membership_assetId_idx` ON `asset_trait_membership` (`asset_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `asset_trait_membership_assetId_valueId_idx` ON `asset_trait_membership` (`asset_id`,`value_id`);--> statement-breakpoint
CREATE TABLE `asset_trait_value` (
	`asset_group_id` text NOT NULL,
	`group_id` text NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`label` text NOT NULL,
	`value` text NOT NULL,
	FOREIGN KEY (`asset_group_id`) REFERENCES `asset_group`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`group_id`) REFERENCES `asset_trait_group`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `asset_trait_value_assetGroupId_groupId_idx` ON `asset_trait_value` (`asset_group_id`,`group_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `asset_trait_value_groupId_value_idx` ON `asset_trait_value` (`group_id`,`value`);--> statement-breakpoint
CREATE TABLE `account` (
	`access_token` text,
	`access_token_expires_at` integer,
	`account_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`id_token` text,
	`password` text,
	`provider_id` text NOT NULL,
	`refresh_token` text,
	`refresh_token_expires_at` integer,
	`scope` text,
	`updated_at` integer NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `account_userId_idx` ON `account` (`user_id`);--> statement-breakpoint
CREATE TABLE `apikey` (
	`config_id` text DEFAULT 'default' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`enabled` integer DEFAULT true,
	`expires_at` integer,
	`id` text PRIMARY KEY NOT NULL,
	`key` text NOT NULL,
	`last_refill_at` integer,
	`last_request` integer,
	`metadata` text,
	`name` text,
	`permissions` text,
	`prefix` text,
	`rate_limit_enabled` integer DEFAULT true,
	`rate_limit_max` integer,
	`rate_limit_time_window` integer,
	`reference_id` text NOT NULL,
	`refill_amount` integer,
	`refill_interval` integer,
	`remaining` integer,
	`request_count` integer DEFAULT 0,
	`start` text,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`reference_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `apikey_configId_idx` ON `apikey` (`config_id`);--> statement-breakpoint
CREATE INDEX `apikey_key_idx` ON `apikey` (`key`);--> statement-breakpoint
CREATE INDEX `apikey_referenceId_idx` ON `apikey` (`reference_id`);--> statement-breakpoint
CREATE TABLE `device_code` (
	`client_id` text,
	`device_code` text NOT NULL,
	`expires_at` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`last_polled_at` integer,
	`polling_interval` integer,
	`scope` text,
	`status` text NOT NULL,
	`user_code` text NOT NULL,
	`user_id` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `deviceCode_deviceCode_idx` ON `device_code` (`device_code`);--> statement-breakpoint
CREATE INDEX `deviceCode_expiresAt_idx` ON `device_code` (`expires_at`);--> statement-breakpoint
CREATE INDEX `deviceCode_status_idx` ON `device_code` (`status`);--> statement-breakpoint
CREATE INDEX `deviceCode_userCode_idx` ON `device_code` (`user_code`);--> statement-breakpoint
CREATE TABLE `identity` (
	`avatar_url` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`display_name` text,
	`email` text,
	`id` text PRIMARY KEY NOT NULL,
	`is_primary` integer DEFAULT false NOT NULL,
	`last_synced_at` integer NOT NULL,
	`linked_at` integer NOT NULL,
	`profile` text,
	`provider` text NOT NULL,
	`provider_id` text NOT NULL,
	`reference_id` text NOT NULL,
	`reference_type` text NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`user_id` text NOT NULL,
	`username` text,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `identity_provider_providerId_idx` ON `identity` (`provider`,`provider_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `identity_referenceType_referenceId_idx` ON `identity` (`reference_type`,`reference_id`);--> statement-breakpoint
CREATE INDEX `identity_userId_idx` ON `identity` (`user_id`);--> statement-breakpoint
CREATE INDEX `identity_userId_provider_idx` ON `identity` (`user_id`,`provider`);--> statement-breakpoint
CREATE TABLE `invitation` (
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`email` text NOT NULL,
	`expires_at` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`inviter_id` text NOT NULL,
	`organization_id` text NOT NULL,
	`role` text,
	`status` text NOT NULL,
	`team_id` text,
	FOREIGN KEY (`inviter_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`team_id`) REFERENCES `team`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
CREATE INDEX `invitation_email_idx` ON `invitation` (`email`);--> statement-breakpoint
CREATE INDEX `invitation_inviterId_idx` ON `invitation` (`inviter_id`);--> statement-breakpoint
CREATE INDEX `invitation_organizationId_idx` ON `invitation` (`organization_id`);--> statement-breakpoint
CREATE INDEX `invitation_teamId_idx` ON `invitation` (`team_id`);--> statement-breakpoint
CREATE TABLE `member` (
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`role` text NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `member_organizationId_idx` ON `member` (`organization_id`);--> statement-breakpoint
CREATE INDEX `member_userId_idx` ON `member` (`user_id`);--> statement-breakpoint
CREATE TABLE `organization` (
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`description` text(256),
	`discord_url` text,
	`github_url` text,
	`id` text PRIMARY KEY NOT NULL,
	`logo` text,
	`metadata` text,
	`name` text NOT NULL,
	`slug` text NOT NULL,
	`telegram_url` text,
	`website_url` text,
	`x_url` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `organization_slug_unique` ON `organization` (`slug`);--> statement-breakpoint
CREATE INDEX `organization_slug_idx` ON `organization` (`slug`);--> statement-breakpoint
CREATE TABLE `session` (
	`active_organization_id` text,
	`active_team_id` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`expires_at` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`impersonated_by` text,
	`ip_address` text,
	`token` text NOT NULL,
	`updated_at` integer NOT NULL,
	`user_agent` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `session_token_unique` ON `session` (`token`);--> statement-breakpoint
CREATE INDEX `session_activeOrganizationId_idx` ON `session` (`active_organization_id`);--> statement-breakpoint
CREATE INDEX `session_activeTeamId_idx` ON `session` (`active_team_id`);--> statement-breakpoint
CREATE INDEX `session_userId_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `solana_wallet` (
	`address` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`is_primary` integer DEFAULT false NOT NULL,
	`name` text,
	`user_id` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `solana_wallet_address_idx` ON `solana_wallet` (`address`);--> statement-breakpoint
CREATE INDEX `solana_wallet_userId_idx` ON `solana_wallet` (`user_id`);--> statement-breakpoint
CREATE TABLE `team` (
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`organization_id` text NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `team_name_idx` ON `team` (`name`);--> statement-breakpoint
CREATE INDEX `team_organizationId_idx` ON `team` (`organization_id`);--> statement-breakpoint
CREATE TABLE `team_member` (
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`team_id` text NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`team_id`) REFERENCES `team`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `team_member_teamId_idx` ON `team_member` (`team_id`);--> statement-breakpoint
CREATE INDEX `team_member_userId_idx` ON `team_member` (`user_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `team_member_teamId_userId_idx` ON `team_member` (`team_id`,`user_id`);--> statement-breakpoint
CREATE TABLE `user` (
	`ban_expires` integer,
	`banned` integer DEFAULT false NOT NULL,
	`ban_reason` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`developer_mode` integer DEFAULT false NOT NULL,
	`display_username` text,
	`email` text NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`image` text,
	`name` text NOT NULL,
	`private` integer DEFAULT false NOT NULL,
	`role` text DEFAULT 'user' NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`username` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `user_username_unique` ON `user` (`username`);--> statement-breakpoint
CREATE TABLE `verification` (
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`expires_at` integer NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `verification_identifier_idx` ON `verification` (`identifier`);--> statement-breakpoint
CREATE TABLE `automation_lock` (
	`expires_at` integer NOT NULL,
	`key` text PRIMARY KEY NOT NULL,
	`run_id` text NOT NULL,
	`started_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `automation_lock_expiresAt_idx` ON `automation_lock` (`expires_at`);--> statement-breakpoint
CREATE TABLE `community_discord_announcement` (
	`announcement_type` text NOT NULL,
	`channel_id` text NOT NULL,
	`channel_name` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`organization_id` text NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `community_discord_announcement_channelId_idx` ON `community_discord_announcement` (`channel_id`);--> statement-breakpoint
CREATE INDEX `community_discord_announcement_enabled_idx` ON `community_discord_announcement` (`enabled`);--> statement-breakpoint
CREATE INDEX `community_discord_announcement_organizationId_idx` ON `community_discord_announcement` (`organization_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `community_discord_announcement_organizationId_announcementType_idx` ON `community_discord_announcement` (`organization_id`,`announcement_type`);--> statement-breakpoint
CREATE TABLE `community_discord_connection` (
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`diagnostics` text,
	`guild_id` text NOT NULL,
	`guild_name` text,
	`last_checked_at` integer,
	`organization_id` text PRIMARY KEY NOT NULL,
	`role_sync_enabled` integer DEFAULT true NOT NULL,
	`status` text NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `community_discord_connection_guildId_idx` ON `community_discord_connection` (`guild_id`);--> statement-breakpoint
CREATE TABLE `community_discord_sync_run` (
	`applied_grant_count` integer DEFAULT 0 NOT NULL,
	`applied_revoke_count` integer DEFAULT 0 NOT NULL,
	`blocked_asset_group_ids` text,
	`dependency_asset_group_ids` text NOT NULL,
	`dependency_fresh_at_start` integer NOT NULL,
	`error_message` text,
	`error_payload` text,
	`failed_count` integer DEFAULT 0 NOT NULL,
	`finished_at` integer,
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`outcome_counts` text NOT NULL,
	`roles_blocked_count` integer DEFAULT 0 NOT NULL,
	`roles_ready_count` integer DEFAULT 0 NOT NULL,
	`started_at` integer NOT NULL,
	`status` text NOT NULL,
	`trigger_source` text NOT NULL,
	`users_changed_count` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `community_discord_sync_run_organizationId_startedAt_idx` ON `community_discord_sync_run` (`organization_id`,`started_at`);--> statement-breakpoint
CREATE INDEX `community_discord_sync_run_organizationId_status_startedAt_idx` ON `community_discord_sync_run` (`organization_id`,`status`,`started_at`);--> statement-breakpoint
CREATE TABLE `community_managed_member` (
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`user_id` text NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `community_managed_member_organizationId_idx` ON `community_managed_member` (`organization_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `community_managed_member_organizationId_userId_idx` ON `community_managed_member` (`organization_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `community_managed_member_userId_idx` ON `community_managed_member` (`user_id`);--> statement-breakpoint
CREATE TABLE `community_membership_sync_run` (
	`add_to_organization_count` integer DEFAULT 0 NOT NULL,
	`add_to_team_count` integer DEFAULT 0 NOT NULL,
	`blocked_asset_group_ids` text,
	`dependency_asset_group_ids` text NOT NULL,
	`dependency_fresh_at_start` integer NOT NULL,
	`error_message` text,
	`error_payload` text,
	`finished_at` integer,
	`id` text PRIMARY KEY NOT NULL,
	`organization_id` text NOT NULL,
	`qualified_user_count` integer DEFAULT 0 NOT NULL,
	`remove_from_organization_count` integer DEFAULT 0 NOT NULL,
	`remove_from_team_count` integer DEFAULT 0 NOT NULL,
	`started_at` integer NOT NULL,
	`status` text NOT NULL,
	`trigger_source` text NOT NULL,
	`users_changed_count` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `community_membership_sync_run_organizationId_startedAt_idx` ON `community_membership_sync_run` (`organization_id`,`started_at`);--> statement-breakpoint
CREATE INDEX `community_membership_sync_run_organizationId_status_startedAt_idx` ON `community_membership_sync_run` (`organization_id`,`status`,`started_at`);--> statement-breakpoint
CREATE TABLE `community_role` (
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`discord_role_id` text,
	`enabled` integer DEFAULT true NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`match_mode` text NOT NULL,
	`name` text NOT NULL,
	`organization_id` text NOT NULL,
	`slug` text NOT NULL,
	`team_id` text NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`organization_id`) REFERENCES `organization`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`team_id`) REFERENCES `team`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `community_role_discordRoleId_idx` ON `community_role` (`discord_role_id`);--> statement-breakpoint
CREATE INDEX `community_role_enabled_idx` ON `community_role` (`enabled`);--> statement-breakpoint
CREATE INDEX `community_role_name_idx` ON `community_role` (`name`);--> statement-breakpoint
CREATE INDEX `community_role_organizationId_idx` ON `community_role` (`organization_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `community_role_organizationId_discordRoleId_idx` ON `community_role` (`organization_id`,`discord_role_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `community_role_organizationId_slug_idx` ON `community_role` (`organization_id`,`slug`);--> statement-breakpoint
CREATE UNIQUE INDEX `community_role_teamId_idx` ON `community_role` (`team_id`);--> statement-breakpoint
CREATE TABLE `community_role_condition` (
	`asset_group_id` text NOT NULL,
	`community_role_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`id` text PRIMARY KEY NOT NULL,
	`maximum_amount` text,
	`minimum_amount` text NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`asset_group_id`) REFERENCES `asset_group`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`community_role_id`) REFERENCES `community_role`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `community_role_condition_assetGroupId_idx` ON `community_role_condition` (`asset_group_id`);--> statement-breakpoint
CREATE INDEX `community_role_condition_communityRoleId_idx` ON `community_role_condition` (`community_role_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `community_role_condition_communityRoleId_assetGroupId_idx` ON `community_role_condition` (`community_role_id`,`asset_group_id`);
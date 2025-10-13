-- Price Cache System Migration (SQLite)
-- Created: 2025-10-13
-- Purpose: Add price cache and sync logging tables for Borsa MCP integration

-- Price cache table
CREATE TABLE `price_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`asset_id` text NOT NULL,
	`asset_type` text NOT NULL,
	`symbol` text,
	`name` text NOT NULL,
	`current_price` real NOT NULL,
	`previous_close` real,
	`change_amount` real,
	`change_percent` real,
	`open_price` real,
	`high_price` real,
	`low_price` real,
	`volume` real,
	`currency` text DEFAULT 'TRY' NOT NULL,
	`market` text,
	`last_updated` integer NOT NULL,
	`data_source` text DEFAULT 'borsa-mcp' NOT NULL,
	`sync_status` text DEFAULT 'active' NOT NULL,
	`error_message` text,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	FOREIGN KEY (`asset_id`) REFERENCES `assets`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint

-- Price sync logs table
CREATE TABLE `price_sync_logs` (
	`id` text PRIMARY KEY NOT NULL,
	`sync_type` text NOT NULL,
	`asset_types` text,
	`total_assets` integer DEFAULT 0 NOT NULL,
	`successful_updates` integer DEFAULT 0 NOT NULL,
	`failed_updates` integer DEFAULT 0 NOT NULL,
	`skipped_updates` integer DEFAULT 0 NOT NULL,
	`started_at` integer NOT NULL,
	`completed_at` integer,
	`duration_ms` integer,
	`status` text NOT NULL,
	`error_message` text,
	`error_details` text,
	`triggered_by` text,
	`sync_config` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint

-- Add price cache fields to assets table
ALTER TABLE `assets` ADD COLUMN `price_source` text DEFAULT 'borsa-mcp';
--> statement-breakpoint
ALTER TABLE `assets` ADD COLUMN `auto_price_update` integer DEFAULT 1;
--> statement-breakpoint
ALTER TABLE `assets` ADD COLUMN `price_cache_enabled` integer DEFAULT 1;
--> statement-breakpoint

-- Indexes for price_cache
CREATE INDEX `price_cache_asset_id_idx` ON `price_cache` (`asset_id`);
--> statement-breakpoint
CREATE INDEX `price_cache_asset_type_idx` ON `price_cache` (`asset_type`);
--> statement-breakpoint
CREATE INDEX `price_cache_symbol_idx` ON `price_cache` (`symbol`);
--> statement-breakpoint
CREATE INDEX `price_cache_last_updated_idx` ON `price_cache` (`last_updated` DESC);
--> statement-breakpoint
CREATE INDEX `price_cache_sync_status_idx` ON `price_cache` (`sync_status`);
--> statement-breakpoint
CREATE INDEX `price_cache_composite_idx` ON `price_cache` (`asset_type`, `last_updated` DESC);
--> statement-breakpoint
CREATE INDEX `price_cache_active_idx` ON `price_cache` (`asset_id`, `last_updated` DESC) WHERE `sync_status` = 'active';
--> statement-breakpoint

-- Indexes for price_sync_logs
CREATE INDEX `price_sync_logs_status_idx` ON `price_sync_logs` (`status`);
--> statement-breakpoint
CREATE INDEX `price_sync_logs_started_at_idx` ON `price_sync_logs` (`started_at` DESC);
--> statement-breakpoint
CREATE INDEX `price_sync_logs_sync_type_idx` ON `price_sync_logs` (`sync_type`);

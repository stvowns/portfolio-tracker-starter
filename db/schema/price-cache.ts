import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { assets } from "./portfolio";

// Price sync status types
export const PRICE_SYNC_STATUS = {
    ACTIVE: "active",
    STALE: "stale",
    ERROR: "error"
} as const;

export type PriceSyncStatus = typeof PRICE_SYNC_STATUS[keyof typeof PRICE_SYNC_STATUS];

// Sync log status types
export const SYNC_LOG_STATUS = {
    RUNNING: "running",
    COMPLETED: "completed",
    FAILED: "failed",
    PARTIAL: "partial"
} as const;

export type SyncLogStatus = typeof SYNC_LOG_STATUS[keyof typeof SYNC_LOG_STATUS];

// Price cache table
export const priceCache = sqliteTable("price_cache", {
    id: text("id").primaryKey(),
    assetId: text("asset_id")
        .notNull()
        .references(() => assets.id, { onDelete: "cascade" }),
    assetType: text("asset_type").notNull(),
    symbol: text("symbol"),
    name: text("name").notNull(),
    
    // Price data
    currentPrice: real("current_price").notNull(),
    previousClose: real("previous_close"),
    changeAmount: real("change_amount"),
    changePercent: real("change_percent"),
    
    // OHLCV data (optional)
    openPrice: real("open_price"),
    highPrice: real("high_price"),
    lowPrice: real("low_price"),
    volume: real("volume"),
    
    // Additional info
    currency: text("currency").notNull().default("TRY"),
    market: text("market"),
    lastUpdated: integer("last_updated", { mode: "timestamp_ms" }).notNull(),
    
    // Metadata
    dataSource: text("data_source").notNull().default("borsa-mcp"),
    syncStatus: text("sync_status").notNull().default("active"),
    errorMessage: text("error_message"),
    
    createdAt: integer("created_at", { mode: "timestamp" })
        .$defaultFn(() => new Date())
        .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
        .$defaultFn(() => new Date())
        .notNull()
}, (table) => {
    return {
        assetIdIndex: index("price_cache_asset_id_idx").on(table.assetId),
        assetTypeIndex: index("price_cache_asset_type_idx").on(table.assetType),
        symbolIndex: index("price_cache_symbol_idx").on(table.symbol),
        lastUpdatedIndex: index("price_cache_last_updated_idx").on(table.lastUpdated),
        syncStatusIndex: index("price_cache_sync_status_idx").on(table.syncStatus),
        compositeIndex: index("price_cache_composite_idx").on(table.assetType, table.lastUpdated)
    };
});

// Price sync logs table
export const priceSyncLogs = sqliteTable("price_sync_logs", {
    id: text("id").primaryKey(),
    syncType: text("sync_type").notNull(),
    assetTypes: text("asset_types"), // JSON array of asset types
    
    // Statistics
    totalAssets: integer("total_assets").notNull().default(0),
    successfulUpdates: integer("successful_updates").notNull().default(0),
    failedUpdates: integer("failed_updates").notNull().default(0),
    skippedUpdates: integer("skipped_updates").notNull().default(0),
    
    // Timing
    startedAt: integer("started_at", { mode: "timestamp_ms" }).notNull(),
    completedAt: integer("completed_at", { mode: "timestamp_ms" }),
    durationMs: integer("duration_ms"),
    
    // Status
    status: text("status").notNull(),
    errorMessage: text("error_message"),
    errorDetails: text("error_details"), // JSON
    
    // Metadata
    triggeredBy: text("triggered_by"),
    syncConfig: text("sync_config"), // JSON
    
    createdAt: integer("created_at", { mode: "timestamp" })
        .$defaultFn(() => new Date())
        .notNull()
}, (table) => {
    return {
        statusIndex: index("price_sync_logs_status_idx").on(table.status),
        startedAtIndex: index("price_sync_logs_started_at_idx").on(table.startedAt),
        syncTypeIndex: index("price_sync_logs_sync_type_idx").on(table.syncType)
    };
});

// Type exports
export type PriceCache = typeof priceCache.$inferSelect;
export type NewPriceCache = typeof priceCache.$inferInsert;

export type PriceSyncLog = typeof priceSyncLogs.$inferSelect;
export type NewPriceSyncLog = typeof priceSyncLogs.$inferInsert;

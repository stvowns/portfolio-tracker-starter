import { sqliteTable, text, integer, real, index } from "drizzle-orm/sqlite-core";
import { user } from "./auth";

// Asset türleri için string sabitleri
export const ASSET_TYPES = {
    GOLD: "GOLD",
    SILVER: "SILVER",
    STOCK: "STOCK",
    FUND: "FUND",
    CRYPTO: "CRYPTO",
    EUROBOND: "EUROBOND"
} as const;

export type AssetType = typeof ASSET_TYPES[keyof typeof ASSET_TYPES];

// Transaction türleri için string sabitleri  
export const TRANSACTION_TYPES = {
    BUY: "BUY",
    SELL: "SELL"
} as const;

export type TransactionType = typeof TRANSACTION_TYPES[keyof typeof TRANSACTION_TYPES];

// Portfolyolar tablosu
export const portfolios = sqliteTable("portfolios", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull(),
    name: text("name").notNull().default("Ana Portföy"),
    baseCurrency: text("base_currency").notNull().default("TRY"),
    createdAt: integer("created_at", { mode: "timestamp" })
        .$defaultFn(() => new Date())
        .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
        .$defaultFn(() => new Date())
        .notNull()
}, (table) => {
    return {
        userIdIndex: index("portfolios_user_id_idx").on(table.userId)
    };
});

// Varlıklar tablosu
export const assets = sqliteTable("assets", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull(),
    portfolioId: text("portfolio_id"),
    assetType: text("asset_type").notNull(),
    symbol: text("symbol"), // AAPL, BTC, vs.
    name: text("name").notNull(), // Apple Inc., Bitcoin, Çeyrek Altın vs.
    category: text("category"), // Tech Stock, Kıymetli Maden vs.
    currentPrice: real("current_price"),
    lastUpdated: integer("last_updated", { mode: "timestamp" }),
    createdAt: integer("created_at", { mode: "timestamp" })
        .$defaultFn(() => new Date())
        .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
        .$defaultFn(() => new Date())
        .notNull()
}, (table) => {
    return {
        userIdIndex: index("assets_user_id_idx").on(table.userId),
        portfolioIdIndex: index("assets_portfolio_id_idx").on(table.portfolioId),
        assetTypeIndex: index("assets_asset_type_idx").on(table.assetType)
    };
});

// İşlemler tablosu
export const transactions = sqliteTable("transactions", {
    id: text("id").primaryKey(),
    userId: text("user_id")
        .notNull(),
    assetId: text("asset_id")
        .notNull(),
    transactionType: text("transaction_type").notNull(),
    quantity: real("quantity").notNull(),
    pricePerUnit: real("price_per_unit").notNull(),
    totalAmount: real("total_amount").notNull(),
    transactionDate: integer("transaction_date", { mode: "timestamp" }).notNull(),
    notes: text("notes"),
    createdAt: integer("created_at", { mode: "timestamp" })
        .$defaultFn(() => new Date())
        .notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" })
        .$defaultFn(() => new Date())
        .notNull()
}, (table) => {
    return {
        userIdIndex: index("transactions_user_id_idx").on(table.userId),
        assetIdIndex: index("transactions_asset_id_idx").on(table.assetId),
        transactionDateIndex: index("transactions_transaction_date_idx").on(table.transactionDate),
        transactionTypeIndex: index("transactions_transaction_type_idx").on(table.transactionType)
    };
});

// Tip dışa aktarımları
export type Portfolio = typeof portfolios.$inferSelect;
export type NewPortfolio = typeof portfolios.$inferInsert;

export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
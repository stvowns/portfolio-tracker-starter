import { pgTable, text, timestamp, numeric, pgEnum, uuid, index } from "drizzle-orm/pg-core";
import { user } from "./auth";

// Asset türleri için enum
export const assetTypeEnum = pgEnum("asset_type", [
    "GOLD",
    "SILVER", 
    "STOCK",
    "FUND",
    "CRYPTO",
    "EUROBOND"
]);

// Transaction türleri için enum  
export const transactionTypeEnum = pgEnum("transaction_type", [
    "BUY",
    "SELL"
]);

// Portfolyolar tablosu
export const portfolios = pgTable("portfolios", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    name: text("name").notNull().default("Ana Portföy"),
    baseCurrency: text("base_currency").notNull().default("TRY"),
    createdAt: timestamp("created_at")
        .$defaultFn(() => new Date())
        .notNull(),
    updatedAt: timestamp("updated_at")
        .$defaultFn(() => new Date())
        .notNull()
}, (table) => {
    return {
        userIdIndex: index("portfolios_user_id_idx").on(table.userId)
    };
});

// Varlıklar tablosu
export const assets = pgTable("assets", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    portfolioId: uuid("portfolio_id")
        .references(() => portfolios.id, { onDelete: "cascade" }),
    assetType: assetTypeEnum("asset_type").notNull(),
    symbol: text("symbol"), // AAPL, BTC, vs.
    name: text("name").notNull(), // Apple Inc., Bitcoin, Çeyrek Altın vs.
    category: text("category"), // Tech Stock, Kıymetli Maden vs.
    currentPrice: numeric("current_price", { precision: 15, scale: 4 }),
    lastUpdated: timestamp("last_updated"),
    createdAt: timestamp("created_at")
        .$defaultFn(() => new Date())
        .notNull(),
    updatedAt: timestamp("updated_at")
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
export const transactions = pgTable("transactions", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
        .notNull()
        .references(() => user.id, { onDelete: "cascade" }),
    assetId: uuid("asset_id")
        .notNull()
        .references(() => assets.id, { onDelete: "cascade" }),
    transactionType: transactionTypeEnum("transaction_type").notNull(),
    quantity: numeric("quantity", { precision: 15, scale: 8 }).notNull(),
    pricePerUnit: numeric("price_per_unit", { precision: 15, scale: 4 }).notNull(),
    totalAmount: numeric("total_amount", { precision: 15, scale: 4 }).notNull(),
    transactionDate: timestamp("transaction_date").notNull(),
    notes: text("notes"),
    createdAt: timestamp("created_at")
        .$defaultFn(() => new Date())
        .notNull(),
    updatedAt: timestamp("updated_at")
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
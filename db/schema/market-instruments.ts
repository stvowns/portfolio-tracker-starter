import { sqliteTable, text, real, integer, blob } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

/**
 * MARKET INSTRUMENTS TABLE
 * Tüm finansal enstrümanların master verileri
 * BIST hisseleri, TEFAS fonları, kripto paralar, emtialar, nakit
 */
export const marketInstruments = sqliteTable('market_instruments', {
  // Primary Fields
  id: text('id').primaryKey(),
  type: text('type').notNull(), // STOCK, FUND, COMMODITY, CRYPTO, CASH
  symbol: text('symbol').notNull(), // GARAN, ADP, BTC, GOLD, TRY
  name: text('name').notNull(),

  // Market Information
  exchange: text('exchange').notNull(), // BIST, TEFAS, MULTIPLE, FREE_MARKET, CBRT
  sector: text('sector'), // Bankacılık, Teknoloji, Fon, Kripto
  industry: text('industry'), // Alt sektör
  city: text('city'), // Şehir (BIST için)

  // Pricing Information
  currency: text('currency').default('TRY'),
  currentPrice: real('current_price'),
  previousClose: real('previous_close'),
  changeAmount: real('change_amount'),
  changePercent: real('change_percent'),
  lastUpdated: integer('last_updated'),

  // Status
  isActive: integer('is_active', { mode: 'boolean' }).default(true),

  // Extra Data (JSON for type-specific information)
  extraData: text('extra_data'), // JSONB equivalent

  // Timestamps
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
});

// Type Enums (for TypeScript)
export const MARKET_INSTRUMENT_TYPES = {
  STOCK: 'STOCK',
  FUND: 'FUND',
  COMMODITY: 'COMMODITY',
  CRYPTO: 'CRYPTO',
  CASH: 'CASH',
  BOND: 'BOND',
  ETF: 'ETF'
} as const;

export const EXCHANGES = {
  BIST: 'BIST',
  TEFAS: 'TEFAS',
  MULTIPLE: 'MULTIPLE',
  FREE_MARKET: 'FREE_MARKET',
  CBRT: 'CBRT'
} as const;

// Relations
export const marketInstrumentsRelations = relations(marketInstruments, ({ many }) => ({
  priceHistory: many(priceHistory),
  userHoldings: many(userHoldings),
  dividends: many(dividends),
}));

// Types
export type MarketInstrument = typeof marketInstruments.$inferSelect;
export type NewMarketInstrument = typeof marketInstruments.$inferInsert;

/**
 * PRICE HISTORY TABLE
 * Tarihsel fiyat verileri
 */
export const priceHistory = sqliteTable('price_history', {
  id: text('id').primaryKey(),
  instrumentId: text('instrument_id').notNull().references(() => marketInstruments.id, { onDelete: 'cascade' }),

  // Price Data
  price: real('price').notNull(),
  volume: integer('volume'), // Hacim
  highPrice: real('high_price'),
  lowPrice: real('low_price'),
  openPrice: real('open_price'),
  changeAmount: real('change_amount'),
  changePercent: real('change_percent'),

  // Metadata
  currency: text('currency').notNull(),
  dataSource: text('data_source').notNull(), // bist-api, tefas-api, coinbase-api

  // Timestamp
  timestamp: integer('timestamp').notNull(),
});

// Relations
export const priceHistoryRelations = relations(priceHistory, ({ one }) => ({
  instrument: one(marketInstruments, {
    fields: [priceHistory.instrumentId],
    references: [marketInstruments.id],
  }),
}));

// Types
export type PriceHistory = typeof priceHistory.$inferSelect;
export type NewPriceHistory = typeof priceHistory.$inferInsert;

/**
 * DIVIDENDS TABLE
 * Temettü ve kupon ödemeleri
 */
export const dividends = sqliteTable('dividends', {
  id: text('id').primaryKey(),
  instrumentId: text('instrument_id').notNull().references(() => marketInstruments.id, { onDelete: 'cascade' }),

  // Dividend Data
  amount: real('amount').notNull(),
  dividendType: text('dividend_type').notNull(), // CASH, STOCK, BOND_COUPON
  exDate: integer('ex_date').notNull(), // Ex-dividend date
  paymentDate: integer('payment_date'), // Payment date

  // Metadata
  currency: text('currency').notNull(),
  description: text('description'),

  // Timestamp
  createdAt: integer('created_at').notNull(),
});

// Types
export type Dividend = typeof dividends.$inferSelect;
export type NewDividend = typeof dividends.$inferInsert;

/**
 * USER HOLDINGS TABLE
 * Kullanıcıların portföy varlıkları
 */
export const userHoldings = sqliteTable('user_holdings', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => marketInstruments.id),
  portfolioId: text('portfolio_id').notNull(), // References portfolios table
  instrumentId: text('instrument_id').notNull().references(() => marketInstruments.id, { onDelete: 'cascade' }),

  // Position Data
  quantity: real('quantity').notNull(),
  avgCost: real('avg_cost').notNull(),
  totalCost: real('total_cost').notNull(),

  // Calculated fields (for performance)
  currentValue: real('current_value'),
  profitLoss: real('profit_loss'),
  profitLossPercent: real('profit_loss_percent'),

  // Metadata
  firstPurchaseDate: integer('first_purchase_date'),
  lastUpdated: integer('last_updated').notNull(),

  // Unique constraint on user-instrument-portfolio combination
}, (table) => ({
  uniqueUserInstrumentPortfolio: {
    columns: [table.userId, table.instrumentId, table.portfolioId],
  },
}));

// Relations
export const userHoldingsRelations = relations(userHoldings, ({ one }) => ({
  instrument: one(marketInstruments, {
    fields: [userHoldings.instrumentId],
    references: [marketInstruments.id],
  }),
}));

// Types
export type UserHolding = typeof userHoldings.$inferSelect;
export type NewUserHolding = typeof userHoldings.$inferInsert;

/**
 * SYNC PERFORMANCE LOG TABLE
 * Senkronizasyon performans logları
 */
export const syncPerformanceLog = sqliteTable('sync_performance_log', {
  id: text('id').primaryKey(),

  // Sync Metadata
  syncType: text('sync_type').notNull(), // BIST, TEFAS, CRYPTO, ALL
  batchCount: integer('batch_count').notNull(),
  totalRecords: integer('total_records').notNull(),
  processedRecords: integer('processed_records').notNull(),
  failedRecords: integer('failed_records').notNull(),

  // Performance Metrics
  durationMs: integer('duration_ms').notNull(),
  memoryUsageMb: integer('memory_usage_mb'),

  // Status
  status: text('status').notNull(), // running, completed, failed, partial

  // Error Information
  errorMessage: text('error_message'),
  errorDetails: text('error_details'),

  // Configuration
  syncConfig: text('sync_config'), // JSON string

  // Timestamp
  createdAt: integer('created_at').notNull(),
});

// Types
export type SyncPerformanceLog = typeof syncPerformanceLog.$inferSelect;
export type NewSyncPerformanceLog = typeof syncPerformanceLog.$inferInsert;
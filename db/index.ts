import 'dotenv/config';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as authSchema from './schema/auth';
import * as portfolioSchema from './schema/portfolio';
import * as priceCacheSchema from './schema/price-cache';

const sqlite = new Database(process.env.DATABASE_URL!.replace('file:', ''));
export const db = drizzle(sqlite, {
  schema: {
    ...authSchema,
    ...portfolioSchema,
    ...priceCacheSchema,
  },
});

// Export all schema types
export const {
  user,
  session,
  account,
  verification,
} = authSchema;

export const {
  portfolios,
  assets,
  transactions,
  assetTypeEnum,
  transactionTypeEnum
} = portfolioSchema;

export const {
  priceCache,
  priceSyncLogs,
  tickerCache,
  tickerSyncLogs,
  PRICE_SYNC_STATUS,
  SYNC_LOG_STATUS
} = priceCacheSchema;

// Export types
export type {
  Portfolio,
  NewPortfolio,
  Asset,
  NewAsset,
  Transaction,
  NewTransaction
} from './schema/portfolio';

export type {
  PriceCache,
  NewPriceCache,
  PriceSyncLog,
  NewPriceSyncLog,
  TickerCache,
  NewTickerCache,
  TickerSyncLog,
  NewTickerSyncLog
} from './schema/price-cache';

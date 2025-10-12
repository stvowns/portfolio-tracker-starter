import 'dotenv/config';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as authSchema from './schema/auth';
import * as portfolioSchema from './schema/portfolio';
import * as appSchema from '../lib/db/schema';

const sqlite = new Database(process.env.DATABASE_URL!.replace('file:', ''));
export const db = drizzle(sqlite, {
  schema: {
    ...authSchema,
    ...portfolioSchema,
    ...appSchema,
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
  calendarEvents,
  tasks,
  expenses
} = appSchema;

// Export types
export type {
  Portfolio,
  NewPortfolio,
  Asset,
  NewAsset,
  Transaction,
  NewTransaction
} from './schema/portfolio';

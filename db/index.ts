import 'dotenv/config';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as authSchema from './schema/auth';
import * as appSchema from '../lib/db/schema';

export const db = drizzle(process.env.DATABASE_URL!, {
  schema: {
    ...authSchema,
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
  calendarEvents,
  tasks,
  expenses
} = appSchema;
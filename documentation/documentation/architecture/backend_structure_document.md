# Backend Structure Document

# Backend Structure Document

This document outlines the backend setup for the Portfolio Tracker Starter project. It explains the architecture, database, APIs, hosting, infrastructure, security, and maintenance in clear, everyday language.

## 1. Backend Architecture

We use a modern, modular architecture that makes the backend easy to scale, maintain, and keep fast:

- **Next.js App Router & API Routes**: All server logic lives in Next.js API routes. This lets us write both frontend pages and backend functions in one codebase. 
- **TypeScript**: Every file is typed. This prevents common bugs and makes it easier to understand how data flows.
- **Drizzle ORM with PostgreSQL**: A type-safe layer over the SQL database. We define our tables in code, and Drizzle generates SQL queries for us. 
- **Better Auth**: Handles user sign-up, sign-in, session management, and password security out of the box.
- **Design Patterns**:
  - **Modular Directory Structure**: We separate concerns into `db/` for schema, `app/api/` for endpoints, `lib/` for business logic, and `components/` for reusable UI pieces.
  - **Service Layer**: All portfolio or pricing calculations live in `lib/`, making logic easy to test and reuse.

This setup supports:
- **Scalability**: Next.js serverless functions can grow with demand, and we can add more database replicas or read-only nodes if needed.
- **Maintainability**: Clear folders, strong typing, and single-purpose modules keep the code easy to navigate and update.
- **Performance**: API routes can cache responses, and the combination of TypeScript and Drizzle’s query optimization helps keep server overhead low.

## 2. Database Management

We rely on a relational database for safe, structured financial data storage:

- **Database Technology**:
  - **Type**: SQL (relational).
  - **System**: PostgreSQL.
- **ORM**: Drizzle ORM connects our TypeScript code to Postgres tables.
- **Data Organization**:
  - **Users & Sessions**: Managed by Better Auth in a dedicated `users` and `sessions` table.
  - **Assets**: Each user can track multiple assets (gold, silver, stocks, funds, crypto).
  - **Transactions**: Every buy or sell is an individual record, enabling per-lot tracking and FIFO logic.
- **Best Practices**:
  - **Type Safety**: Our schema definitions in Drizzle ensure application data always matches database types.
  - **Migrations**: We use Drizzle’s migration tool to apply schema changes without losing data.
  - **Indexes**: We add indexes on foreign keys (`user_id`, `asset_id`) to speed up queries for large portfolios.

## 3. Database Schema

Below is a human-readable overview and a PostgreSQL schema for our core tables.

### Human-Readable Schema

• **users** (managed by Better Auth)
  – id (unique identifier)
  – email, hashed_password, created_at

• **assets**
  – id (unique identifier)
  – user_id (links to users)
  – name (e.g., "Gold", "AAPL Stock")
  – type ("metal", "stock", "fund", "crypto")
  – ticker_symbol (optional, e.g., "AAPL")
  – created_at

• **transactions**
  – id (unique identifier)
  – asset_id (links to assets)
  – type ("buy" or "sell")
  – quantity (number)
  – price_per_unit (decimal)
  – transaction_date
  – created_at

### SQL Schema (PostgreSQL)

```sql
-- Users table (managed by Better Auth)
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  hashed_password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Assets table
CREATE TABLE IF NOT EXISTS assets (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  ticker_symbol TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ON assets(user_id);

-- Transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY,
  asset_id UUID REFERENCES assets(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('buy','sell')) NOT NULL,
  quantity NUMERIC NOT NULL,
  price_per_unit NUMERIC NOT NULL,
  transaction_date TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX ON transactions(asset_id);
```

## 4. API Design and Endpoints

We expose a set of RESTful API routes under `app/api/` in Next.js:

- **User & Auth** (via Better Auth)
  - POST `/api/auth/signup`
  - POST `/api/auth/signin`
  - GET `/api/auth/session`

- **Portfolio & Assets**
  - GET `/api/assets` → list current user’s assets
  - POST `/api/assets` → add a new asset
  - GET `/api/assets/[id]` → get one asset’s details

- **Transactions**
  - GET `/api/transactions?assetId=` → list transactions for an asset
  - POST `/api/transactions` → record a buy or sell
  - PUT `/api/transactions/[id]` → update a transaction
  - DELETE `/api/transactions/[id]` → remove a transaction

- **External Price Feeds**
  - GET `/api/prices/metal?symbol=` → fetch gold/silver prices
  - GET `/api/prices/fund?code=` → fetch TEFAS fund prices
  - GET `/api/prices/stock?symbol=` → fetch stock prices

All endpoints validate the authenticated user before returning or modifying data. We use simple JSON request/response formats.

## 5. Hosting Solutions

We support two main hosting approaches:

1. **Vercel (Recommended for Quick Launch)**
   - **Serverless Functions**: API routes auto-deploy as serverless endpoints.
   - **Built-in CDN**: Static assets and pages are cached worldwide.
   - **Automatic Scaling & Zero Ops**: No manual server configuration.
   - **Free Tier** for hobby projects.

2. **Containerized Deployment (Docker)**
   - **Docker Compose** for local development.
   - **Production on AWS/ECS, GCP Cloud Run, or DigitalOcean App Platform**.
   - **Managed PostgreSQL** (AWS RDS, Supabase, or ElephantSQL).
   - **Flexibility** to add sidecars (e.g., Redis for caching) or custom networking.

## 6. Infrastructure Components

To keep the app fast and reliable, we layer in a few key services:

- **CDN & Static Assets**: Vercel’s CDN (or CloudFront in a custom setup) caches images, scripts, and style files.
- **Load Balancing & Auto-Scaling**: Handled by Vercel or your container platform, balancing traffic across instances.
- **Caching**:
  - **HTTP Caching**: We set cache headers on API responses when prices don’t need to be real-time every second.
  - **In-Memory Cache (Optional)**: Add Redis for shared caching of external API responses.
- **Background Jobs**:
  - **Scheduled Tasks**: Vercel Cron Jobs or a container-based scheduler for daily portfolio summaries and notifications.
- **Local Development**: Docker Compose spins up Postgres and the Next.js server with one command.

## 7. Security Measures

We follow industry best practices to keep data safe:

- **Authentication & Authorization**:
  - Better Auth enforces secure sign-up/sign-in with hashed passwords.
  - Every API route checks the user’s session before running.
- **Encryption**:
  - **TLS Everywhere**: All traffic (web and database connections) uses SSL/TLS.
  - **Env Variables**: Secrets (DB passwords, API keys) live in environment variables, never in code.
- **Rate Limiting & Throttling** (optional)
  - Implement rate limits on price-fetch endpoints to avoid abuse.
- **Input Validation**:
  - We sanitize and validate every request body and query parameter in our API routes.
- **Compliance**:
  - If handling personal data (emails), we can add GDPR-friendly features like account data export/deletion.

## 8. Monitoring and Maintenance

To keep the backend healthy and catch issues early, we use:

- **Error Tracking**: Sentry or LogRocket captures exceptions in serverless functions.
- **Performance Monitoring**: Vercel Analytics or New Relic tracks response times and throughput.
- **Database Monitoring**: Cloud provider tools (e.g., AWS CloudWatch) alert on slow queries or high CPU.
- **Logging**:
  - Structured logs (JSON) written by `console` or a logger library, shipped to a log service.
- **Backups & Migrations**:
  - Daily automated backups of PostgreSQL.
  - Versioned migrations via Drizzle ensure schema changes are safe.

## 9. Conclusion and Overall Backend Summary

This backend is built to power a robust, personalized portfolio tracker:

- It uses Next.js API routes and serverless functions for fast, scalable endpoints.
- PostgreSQL via Drizzle ORM ensures data integrity and easy schema evolution.
- Better Auth secures user access.
- A clear folder structure and TypeScript-driven development make the codebase maintainable.
- Hosting on Vercel provides zero-ops scaling and a global CDN, with an alternate Docker path for full control.
- Layers like caching, scheduled jobs, and monitoring round out a production-ready setup.

With this foundation, you can confidently add features—live price feeds, advanced charts, multi-currency views, notifications, and premium access—while resting easy that the backend is secure, performant, and easy to extend.

---
**Document Details**
- **Project ID**: 9996f6d0-22b9-4cb2-a2e4-6f42e720cff0
- **Document ID**: c56e4987-c8d8-403a-8e40-0a26cede5a83
- **Type**: custom
- **Custom Type**: backend_structure_document
- **Status**: completed
- **Generated On**: 2025-10-12T15:23:06.033Z
- **Last Updated**: N/A

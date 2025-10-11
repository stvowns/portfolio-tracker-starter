# Backend Structure Document

# Backend Structure Document for ai-planner-assistant

## 1. Backend Architecture

This section describes how the backend is organized, which frameworks and patterns it uses, and why this setup supports growth, easy maintenance, and good performance.

**Key Technologies**
- Next.js 15 (App Router)
- Node.js (server runtime)
- TypeScript (strong typing)
- Drizzle ORM (type-safe database queries)
- PostgreSQL (relational database)
- Better Auth (user authentication)
- Docker (development environment)
- OpenAI GPT-4o (AI chat engine)

**Overall Design**
- **Next.js App Router**:  Server Components render dashboard data on the server for performance, and Client Components power interactive pages like the AI chat interface.
- **API Routes**:  All backend logic (chat processing, CRUD for events/tasks/expenses) lives in Next.js API routes under `/app/api`. This keeps frontend and backend in one codebase.
- **Layered Structure**:  
  - **`app/`** handles routing and page logic.
  - **`db/`** holds Drizzle schema definitions and database connection.
  - **`lib/`** contains helper modules (authentication checks, OpenAI client).
  - **`components/`** provides reusable UI bits (charts, tables, chat bubbles).

**Scalability & Maintainability**
- **Serverless Functions** on Vercel auto-scale with traffic spikes—no manual server management.
- **TypeScript + Drizzle** ensures compile-time checks from API all the way to the database, reducing runtime errors and simplifying refactoring.
- **Modular Folder Layout** keeps authentication, chat logic, and database code separated, making it easy for new developers to jump in.

## 2. Database Management

**Database Technology**
- **Type**: Relational (SQL)
- **System**: PostgreSQL
- **ORM**: Drizzle ORM (type-safe, schema-driven queries)

**Data Practices**
- **Schema-First**: Tables and columns are defined in TypeScript (`db/schema.ts`), and Drizzle generates type definitions for queries.
- **Versioned Migrations**: As your schema evolves, each change is tracked in a migration file, ensuring consistency across development, staging, and production databases.
- **Connection Pooling**: Node.js connects with a pool of connections to avoid opening and closing on every request, boosting performance under load.

**Data Access Patterns**
- **Read Operations**: Server Components fetch user data on the server to reduce client-side JavaScript bundle size and speed up initial page loads.
- **Write Operations**: API routes validate the user’s session, parse incoming JSON (from AI or front-end forms), then call Drizzle methods to insert or update records.

## 3. Database Schema

### Human-Readable Description

1. **users**
   - `id` (UUID): Unique identifier.
   - `email` (text): User’s email, unique.
   - `hashed_password` (text): Secure password storage.
   - `created_at` (timestamp): Account creation date.

2. **calendar_events**
   - `id` (UUID): Unique event ID.
   - `user_id` (UUID): References `users.id`.
   - `title` (text): Event name.
   - `description` (text): Optional details.
   - `start_time` (timestamp): When the event begins.
   - `end_time` (timestamp): When the event ends.
   - `created_at` (timestamp): When the record was created.

3. **tasks**
   - `id` (UUID): Unique task ID.
   - `user_id` (UUID): References `users.id`.
   - `title` (text): Task description.
   - `is_complete` (boolean): Completion status.
   - `due_date` (timestamp): Optional deadline.
   - `created_at` (timestamp): Record creation time.

4. **expenses**
   - `id` (UUID): Unique expense ID.
   - `user_id` (UUID): References `users.id`.
   - `amount` (numeric): Expense amount.
   - `category` (text): E.g., “Food,” “Transport.”
   - `incurred_at` (timestamp): When the expense occurred.
   - `created_at` (timestamp): Record creation time.

### SQL Schema (PostgreSQL)
```sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT NOT NULL UNIQUE,
  hashed_password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  is_complete BOOLEAN DEFAULT false,
  due_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  category TEXT NOT NULL,
  incurred_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

## 4. API Design and Endpoints

The backend uses a RESTful approach with Next.js API routes. Every route verifies the user’s session via Better Auth.

**Primary Endpoints**

- **POST /api/auth/sign-up**
  - Purpose: Create a new user account.
  - Input: `email`, `password`.
  - Output: Session token.

- **POST /api/auth/sign-in**
  - Purpose: Log in an existing user.
  - Input: `email`, `password`.
  - Output: Session token.

- **POST /api/chat**
  - Purpose: Receive a chat message, call OpenAI GPT-4o, parse the intent, and perform a database operation (create event/task/expense).
  - Input: `{ message: string }`.
  - Output: `{ messages: [ { role, text } ] }`.

- **GET /api/events**  &  **POST /api/events**
  - GET retrieves all events for the user.
  - POST creates a new event (used by both chat and dashboard forms).

- **GET /api/tasks**  &  **POST /api/tasks**
  - GET lists tasks.
  - POST adds a task or updates its status.

- **GET /api/expenses**  &  **POST /api/expenses**
  - GET returns a user’s expenses.
  - POST records a new expense.

Each endpoint uses JSON over HTTPS and returns clear status codes (200, 201, 401, 400).

## 5. Hosting Solutions

- **Frontend & API**: Vercel (serverless functions)
  - Auto-deploy on git push
  - Global edge network for low latency
  - Built-in SSL/TLS
- **Database**: Managed PostgreSQL (e.g., AWS RDS, DigitalOcean Managed DB)
  - Automated backups and point-in-time recovery
  - Vertical scaling (CPU, memory) and read replicas for high load

**Benefits**
- **Reliability**: 99.9% uptime SLAs
- **Scalability**: Automatic function scaling and database read replicas
- **Cost-Effectiveness**: Pay-as-you-go pricing—only pay for what you use

## 6. Infrastructure Components

- **Global CDN**: Vercel’s edge network caches static assets (JS, CSS, images) close to users.
- **Load Balancing**: Vercel routes requests across available serverless instances.
- **Connection Pooling**: Managed by Drizzle’s database client to reuse connections.
- **Caching**: Next.js caching headers for server components and optional client-side caching with SWR or React Query.

Together, these components ensure fast page loads, handle traffic spikes smoothly, and offer a consistent user experience.

## 7. Security Measures

- **Authentication**: Better Auth issues HTTP-only cookies for session management.
- **Authorization**: Each API route checks the session; users can only access their own records.
- **Encryption**:
  - In transit: HTTPS/TLS for all requests.
  - At rest: Managed database with built-in disk encryption.
- **Environment Variables**: Secrets (OpenAI API key, database URL) stored securely in Vercel’s environment settings, never committed to code.
- **Input Validation & Sanitization**: All incoming JSON is validated against expected types to prevent injection attacks.

## 8. Monitoring and Maintenance

- **Logs & Metrics**:
  - Vercel Analytics for response times and error rates.
  - AWS CloudWatch (or DigitalOcean monitoring) for database CPU, memory, and connections.
- **Error Tracking**: Sentry or LogRocket captures uncaught exceptions and performance bottlenecks.
- **Health Checks & Alerts**: Automated alerts for high error rates or database connection issues.
- **Database Backups**: Daily snapshots and point-in-time recovery configured by the managed DB service.
- **Regular Updates**:
  - Weekly dependency audits with `npm audit`.
  - Scheduled schema migrations and code releases via CI/CD pipeline.

## 9. Conclusion and Overall Backend Summary

The ai-planner-assistant backend is built on a modern, full-stack foundation:
- **Next.js** for unified frontend and serverless backend logic
- **TypeScript + Drizzle ORM** for end-to-end type safety
- **PostgreSQL** for reliable, relational data storage
- **Better Auth** and HTTPS for secure user sessions
- **Vercel + Managed DB** for hands-off scalability and uptime

This structure supports rapid feature development—like the AI chat interface—while ensuring that as your user base grows, performance remains snappy and data remains safe. By combining serverless functions, a robust database layer, and clear separation of concerns, the project is easy to maintain, extend, and monitor for years to come.

---
**Document Details**
- **Project ID**: 2518caaa-9e53-4baf-9eb4-78aa128bc12b
- **Document ID**: 9dc03897-39dd-4ed3-a7c4-9cef71370063
- **Type**: custom
- **Custom Type**: backend_structure_document
- **Status**: completed
- **Generated On**: 2025-10-11T09:52:22.018Z
- **Last Updated**: N/A

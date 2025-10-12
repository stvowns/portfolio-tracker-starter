# Tech Stack Document

This document explains, in simple terms, the technology choices for the multi-asset portfolio tracker starter. It breaks down each piece of the stack and shows how they fit together to deliver a fast, secure, and user-friendly application.

## 1. Frontend Technologies

Our frontend (what the user sees and interacts with) is built with the following key technologies:

- **Next.js (App Router)**
  • Provides a solid foundation for server-rendered and client-rendered pages.  
  • Lets us set up API routes alongside our pages, keeping frontend and backend code in one project.

- **React & TypeScript**
  • React offers reusable UI building blocks (components).  
  • TypeScript adds type checking, catching errors early and making code easier to maintain.

- **Tailwind CSS (v4)**
  • A utility-first CSS framework that speeds up styling with pre-built classes.  
  • Enables quick theming (light/dark mode) and consistent, responsive layouts.

- **shadcn/ui Component Library**
  • A collection of ready-made UI elements (cards, data tables, buttons, inputs).  
  • Fully customizable so the look and feel stays consistent with your brand.

- **React State & Data Fetching**
  • Basic React hooks (`useState`, `useEffect`) handle local component state.  
  • As the app grows, we can add a library like React Query or SWR for caching and synchronizing server data (e.g., live price updates).

- **Charting Library (e.g., Chart.js or Recharts)**
  • Powers interactive graphs—daily/weekly bar charts, portfolio trends.  
  • Helps users visualize performance at a glance.

**How this enhances user experience**
- Fast initial page loads via server rendering.  
- Smooth, interactive interfaces with pre-built components.  
- Consistent styling and easy theming for light/dark modes.  
- Clear data visualizations to help users understand their portfolio at a glance.

## 2. Backend Technologies

Behind the scenes, these technologies handle data storage, user accounts, and business logic:

- **Next.js API Routes**
  • Serverless functions within the Next.js app.  
  • Host endpoints for portfolio CRUD operations and external data fetching.

- **Node.js & TypeScript**
  • Runs the API routes and connection logic.  
  • TypeScript ensures the backend code is as type-safe as the frontend.

- **Drizzle ORM**
  • A lightweight, type-safe way to define and run SQL queries.  
  • Perfect for complex financial queries (average cost, FIFO logic for fund sales).

- **PostgreSQL**
  • A powerful, open-source relational database.  
  • Stores users, assets, transactions, and handles queries that power the dashboard.

- **better-auth**
  • Simplifies user authentication (sign-up, sign-in, session management).  
  • Supports secure, personalized portfolios tied to each user account.

**How these components work together**
1. A user logs in via **better-auth**.
2. Frontend calls Next.js API routes to read/write data.  
3. **Drizzle ORM** sends type-safe SQL queries to **PostgreSQL**.  
4. The server responds, and the UI updates to show the latest portfolio data.

## 3. Infrastructure and Deployment

To keep the project reliable, scalable, and easy to maintain, we’ve chosen:

- **Version Control: Git & GitHub**
  • Tracks changes and enables team collaboration.  
  • Pull requests and code reviews ensure quality before merging.

- **Hosting Platform: Vercel**
  • Native support for Next.js, automatic builds and deployments on every push.  
  • Global CDN ensures fast page loads for users worldwide.

- **Containerization: Docker & Docker Compose**
  • Defines a consistent environment for local development and production.  
  • Simplifies setup of the database and app dependencies.

- **CI/CD: GitHub Actions (optional)**
  • Automates testing, builds, and deployments on code changes.  
  • Ensures that only passing code reaches production.

- **Environment Management**
  • Environment variables (via Vercel or `.env` files) keep secrets like database URLs and API keys secure.

- **Scheduled Tasks: Vercel Cron Jobs (optional)**
  • Can run daily portfolio summary calculations and send notifications to users.

**Benefits**
- Zero-downtime deployments and quick rollbacks.  
- Consistent environments across developer machines and production.  
- Automated testing and deployment pipelines for faster releases.

## 4. Third-Party Integrations

We connect to outside services to enrich the user experience:

- **Real-Time Market Data APIs**
  • TEFAS for fund prices, commodity APIs for gold/silver rates, stock exchange feeds.  
  • Integrated via Next.js API routes to fetch and cache prices server-side.

- **Currency Exchange Rates**
  • Optional service to convert portfolio values between currencies (e.g., USD/TRY).

- **Push Notifications** (future)
  • Services like OneSignal or Firebase Cloud Messaging for daily portfolio updates.

- **Analytics** (optional)
  • Google Analytics or similar to track user engagement and help guide feature improvements.

**Advantages**
- Keeps portfolio values up-to-date without manual entry.  
- Displays multi-currency totals for international users.  
- Enables alerting users about significant portfolio changes.

## 5. Security and Performance Considerations

To protect user data and deliver a responsive experience, we’ve implemented:

- **Secure Authentication**
  • Session tokens or JWTs managed by **better-auth**.  
  • Password hashing and secure cookies over HTTPS.

- **Data Protection**
  • Environment variables to store secrets and API keys.  
  • Parameterized queries via Drizzle ORM to prevent SQL injection.

- **Performance Optimizations**
  • Server-side rendering (SSR) for critical pages to speed up initial load.  
  • Code-splitting and lazy loading of non-essential components.  
  • Caching of external API responses to reduce latency and API usage.

- **Error Handling & Monitoring**
  • Graceful error messages when external APIs fail.  
  • Logging (e.g., Sentry) to catch and report runtime errors in production.

## 6. Conclusion and Overall Tech Stack Summary

In summary, this stack was chosen to deliver a maintainable, scalable, and user-friendly portfolio tracker starter:

- Frontend: Next.js, React, TypeScript, Tailwind CSS, shadcn/ui
- Backend: Next.js API routes, Node.js, TypeScript, Drizzle ORM, PostgreSQL, better-auth
- Infrastructure: Git/GitHub, Vercel, Docker, Docker Compose, CI/CD pipelines
- Third-Party Integrations: Market data APIs, currency converters, notifications, analytics
- Security & Performance: Secure auth, SSR, caching, error monitoring

This combination ensures:
- **Rapid development** with reusable components and type safety
- **High performance** through server rendering and optimized code delivery
- **Robust security** with proven authentication methods and safe database queries
- **Flexibility** to add new features—charts, mobile support, premium plans—without changing the core architecture

By choosing these technologies, we lay a solid foundation that meets today’s needs and scales easily for tomorrow’s innovations.
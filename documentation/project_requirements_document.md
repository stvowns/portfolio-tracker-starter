# Project Requirements Document

## 1. Project Overview

This project is a starter boilerplate for a multi-asset portfolio tracker web application. It provides the essential building blocks—secure user authentication, a protected dashboard, a scalable database schema, a modern UI component library, and dynamic theming—so developers can rapidly build a personalized portfolio tracker for assets like gold, silver, stocks, funds, and cryptocurrency. By offering a well-architected Next.js and TypeScript foundation, the codebase eliminates repetitive setup work and lets teams focus on adding domain-specific features such as financial calculations, live price feeds, and advanced visualizations.

The core problem this starter solves is speeding up time-to-market while enforcing best practices in security, type safety, and UI consistency. It’s being built to ensure that every new feature—whether manual transaction entry, real-time market integration, or premium subscription logic—can slot into an existing folder structure and data model without confusion or rework. Key success criteria for the first version are: a working sign-up/sign-in flow; a CRUD interface for tracking asset transactions; a dynamic dashboard showing aggregated portfolio data; and a code structure that can be extended smoothly in future phases.

## 2. In-Scope vs. Out-of-Scope

**In-Scope (Version 1)**
- Secure user sign-up and sign-in using Better Auth
- A protected dashboard page showing placeholder or manually entered portfolio summaries
- Database schemas for Users, Assets, and Transactions defined via Drizzle ORM + PostgreSQL
- CRUD operations (Create, Read, Update, Delete) for manual asset transactions
- Reusable UI components (cards, tables, forms) via shadcn/ui and Tailwind CSS
- Dark/light theme toggle
- API route skeletons in `app/api/` for future external price feed integration
- Docker and docker-compose configuration for local development and deployment

**Out-of-Scope (Planned for Later Phases)**
- Real-time price feed integration (automating market data fetch)
- Data visualizations (charts for historical performance)
- Multi-currency support and exchange rate conversions
- Push notifications or email alerts for portfolio changes
- Freemium model or subscription management
- Native mobile app (React Native or WebView wrapper)
- Advanced testing suite (beyond basic unit tests)

## 3. User Flow

When a new user arrives, they land on a public sign-up/sign-in page. After entering their email and password, the user is securely authenticated and redirected to their private dashboard. On the dashboard, they see a high-level summary: total portfolio value, profit/loss for the day, and a table listing each asset with quantity and average cost. A theme toggle in the top bar lets them switch between light and dark modes.

To track assets, the user clicks an “Add Transaction” button, which opens a modal form. In this form they select an asset type (e.g., gold, stock, crypto), fill in quantity, price per unit, date, and whether it’s a buy or sell. Upon submission, the data is saved to the PostgreSQL database. The dashboard automatically updates to include the new transaction in both the summary cards and the data table. If the user clicks on an asset row, they navigate to an asset-detail page that lists every lot or transaction for deeper analysis.

## 4. Core Features

- **Authentication Module**: Sign-up, sign-in, and session management via Better Auth.
- **Dashboard**: Protected page showing aggregated portfolio metrics and a data table of assets.
- **Database Schema**: Drizzle ORM models for Users, Assets, Transactions (fields: assetType, quantity, pricePerUnit, date, buy/sell).
- **Transaction CRUD**: Modal or page for adding, editing, and deleting manual transactions.
- **UI Component Library**: Cards, tables, forms, buttons from shadcn/ui; styled with Tailwind CSS.
- **Theme Switcher**: Dark/light mode toggle stored in user preference.
- **API Routes Skeleton**: Next.js server routes under `app/api/` to handle external data calls.
- **Docker Configuration**: Dockerfile and docker-compose for reproducible local and production environments.

## 5. Tech Stack & Tools

- **Frontend**: Next.js (App Router), React, TypeScript
- **Authentication**: Better Auth
- **Database & ORM**: PostgreSQL, Drizzle ORM
- **UI Library**: shadcn/ui
- **Styling**: Tailwind CSS v4
- **State Management**: React hooks (with optional React Query later)
- **API Layer**: Next.js API routes in `app/api/`
- **Containerization**: Docker, docker-compose
- **Charting (future)**: Recharts or Chart.js
- **Testing (future)**: Jest or Playwright/Cypress

## 6. Non-Functional Requirements

- **Performance**: Initial page load under 2 seconds on broadband; subsequent navigations under 1 second via client-side routing.
- **Security**: HTTPS enforcement; secure cookies; server-side input validation; OWASP Top 10 considerations.
- **Scalability**: Well-normalized database schema; stateless API routes; Dockerized services for horizontal scaling.
- **Usability**: Accessible (WCAG 2.1 AA) components; responsive layout on mobile/tablet; dark/light modes.
- **Reliability**: Graceful error handling in UI when API calls fail; retry logic for transient errors.

## 7. Constraints & Assumptions

- The project will run on Node.js 18+ and a managed PostgreSQL instance.
- Better Auth and Drizzle must be available and compatible with Next.js App Router.
- Manual price entry is acceptable in V1; external API keys (TEFAS, crypto, commodities) aren’t required yet.
- Users have modern browsers that support ES6 modules and CSS variables for theming.
- Development and production environments use Docker to minimize “works on my machine” issues.

## 8. Known Issues & Potential Pitfalls

- **API Rate Limits**: Future integration with external price feeds may hit rate limits—plan caching and back-off strategies.
- **Data Consistency**: Manual transaction entry can lead to user errors—implement client-side and server-side validations.
- **Database Migrations**: Evolving schemas (e.g., adding subscription fields) require careful migration planning with Drizzle’s migration tool.
- **Theming Edge Cases**: Some third-party components might not honor Tailwind’s dark mode—test and apply overrides as needed.
- **Deployment Environment Variables**: Ensure secrets (DB URL, auth keys) are injected securely in CI/CD pipelines.
- **Performance Bottlenecks**: Large portfolios could slow down the dashboard table—introduce pagination or virtualization if needed.

---

This PRD provides a clear, unambiguous reference for the AI or development team to generate subsequent technical documentation—Frontend Guidelines, Backend Structure, App Flow, File Structure, and IDE Rules—without any guesswork.
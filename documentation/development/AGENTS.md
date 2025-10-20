# AI Development Agent Guidelines

## Project Overview
**Project:** portfolio-tracker-starter
**** ## Enhanced Repository Summary: Portfolio Tracker Starter for Multi-Asset Tracking

This repository presents a robust and well-architected Next.js starter project, providing an ideal foundation for building the user's desired multi-asset portfolio tracking application (for gold, silver, stocks, funds, crypto, etc.). It offers a comprehensive, production-ready starting point covering user authentication, a scalable database structure, a modern UI component library, and theming, significantly accelerating the development of a feature-rich, personalized portfolio tracker.

### 1. What this codebase does (and how it supports your goals)

The core purpose of this codebase is to serve as a **feature-rich boilerplate for a portfolio tracking application**, making it perfectly suited for your project. The existing functionality directly maps to your core requirements:

*   **User Authentication:** Secure sign-up and sign-in capabilities using `better-auth`. This is the foundation for allowing users to create private, personalized portfolios. Each user account will be the anchor for their specific asset and transaction data.
*   **Interactive Dashboard:** A dedicated, protected dashboard area is already built. This is the primary canvas where you will replace the placeholder static data with dynamic, user-specific portfolio information, including profit/loss summaries, asset lists, and performance charts.
*   **Rich UI Components:** Integrates `shadcn/ui` (New York style), providing a complete set of pre-built, customizable components like **Cards, Data Tables, Inputs, and Buttons**. These are essential for quickly building the UI for manual asset entry forms, the asset drill-down views, and the main dashboard layout you envisioned.
*   **Database Foundation:** Configured with Drizzle ORM and PostgreSQL. This type-safe, relational database setup is **critical for your application's logic**. It will allow you to precisely model the relationships between users, assets, and individual transactions, which is necessary for tracking multiple purchases of the same asset (e.g., two separate purchases of "çeyrek altın") and implementing specific selling logic (like FIFO for funds).
*   **Dynamic Theming:** Built-in dark mode support enhances user experience, a key element for a modern, user-friendly application.

### 2. Key architecture and technology choices

The project's modern, full-stack architecture is an excellent fit for building a scalable and maintainable portfolio application:

*   **Frontend Framework:** **Next.js (App Router)** is central. Its API routes are perfect for the second phase of your project, where you will fetch live price data from external APIs (TEFAS, gold prices, etc.). The server-side capabilities ensure fast performance.
*   **Language:** **TypeScript** is used throughout. This is a major advantage for your project, as it will ensure data integrity and prevent errors when modeling complex financial data structures for different asset types.
*   **Authentication:** **Better Auth** provides a streamlined solution for managing user accounts, which will be essential for linking portfolio data to specific users and later, for managing access to your planned "premium" features.
*   **Database & ORM:** **PostgreSQL** and **Drizzle ORM** are an ideal combination. Drizzle's type safety will allow you to create precise database schemas for your assets and transactions, ensuring that quantity, price, and date are stored accurately.
*   **UI Library:** **`shadcn/ui`** gives you the building blocks to create the "simple and sade" interface you desire, without locking you into a rigid design system.
*   **Styling:** **Tailwind CSS (v4)** enables rapid development of a custom, clean user interface.
*   **State Management:** Standard React hooks are sufficient for starting. As you add features like real-time price updates, you can easily integrate a library like React Query for managing server state.

### 3. Main components and how they interact

The existing modular structure provides a clear path for implementing your features:

*   **`app/dashboard/`:** This is where you will build the main portfolio overview. You can use `shadcn/ui`'s Card components to display overall portfolio value, daily/weekly change, and the bar graphs for performance.
*   **`components/data-table.tsx`:** This component is a **perfect starting point** for listing a user's assets. You can adapt it to show columns like "Asset Name," "Quantity," "Average Cost," "Current Value," and "P/L." When a user clicks on an asset row (e.g., "Kıymetli Madenler"), you can navigate them to a detailed view showing all individual transactions for that asset.
*   **`db/schema/auth.ts`:** You will extend this directory with new schema files (e.g., `portfolio.ts`, `transactions.ts`) to define your data models. This is where you'll create tables to store each individual purchase and sale, enabling the "kalem kalem tutma" (item-by-item tracking) feature.
*   **`app/api/` directory:** This is where you will build the endpoints to fetch live market data. For example, you could create `app/api/prices/tefas/route.ts` to get the latest fund prices.
*   **Interaction Flow for Your App:** A user signs in and is directed to the `dashboard`. The dashboard page will fetch the user's assets and transactions from your PostgreSQL database using Drizzle. The `data-table` will display these assets. You will add a "New Transaction" button (using the `Button` component) that opens a form (using `Input` components) for manual entry of asset, quantity, and price. This data is then saved to the database, and the dashboard updates to reflect the new state.

### 4. Notable patterns, configurations, or design decisions

This starter's design decisions directly support your development goals:

*   **Type-Driven Development:** Essential for financial applications to ensure calculations are correct and data models are consistent.
*   **Component-Driven UI:** The `shadcn/ui` approach allows you to build your specific UI for forms and data displays quickly and maintain ownership over the code.
*   **Tailwind CSS with Theming:** Provides the flexibility to create a clean, modern aesthetic that is easy to maintain.
*   **Drizzle ORM:** The choice of Drizzle is a significant advantage. Its SQL-like syntax and type safety are perfect for writing the complex queries you'll need, such as calculating average cost or fetching transactions for a specific asset lot.
*   **Docker Support:** The included `Dockerfile` and `docker-compose.yml` simplify the process of deploying your web app to production once it's ready.

### 5. Overall code structure and organization

The repository's clean and standard Next.js structure is well-prepared for the features you plan to add. You will primarily be working in these areas:
*   **`db/schema/`**: To define your portfolio, asset, and transaction tables.
*   **`app/dashboard/`**: To build out the main user interface.
*   **`components/`**: To create new, reusable components like an `AddTransactionModal` or a `PerformanceChart`.
*   **`lib/`**: To add business logic for P/L calculations, portfolio performance metrics, and handling different asset rules (e.g., FIFO for funds).
*   **`app/api/`**: To integrate external price data APIs.

### 6. Code quality observations and actionable recommendations for your project

This codebase provides a high-quality foundation. To build your specific application, here are tailored recommendations:

*   **Implement Your Database Schema First:** This is your most critical next step. Define your Drizzle schemas for `Assets` and `Transactions`. An `Asset` could have a `type` field ('stock', 'fund', 'crypto', 'metal'). A `Transaction` table should link to an asset and store `type` ('buy'/'sell'), `quantity`, `price_per_unit`, and `transaction_date`. This directly enables the lot-by-lot tracking you require.
*   **Build the CRUD Functionality:** Implement the forms and API logic for Creating, Reading, Updating, and Deleting transactions. Start with manual price entry as planned.
*   **Develop a Calculation Service:** In the `lib/` directory, create a dedicated module for all financial calculations (e.g., total portfolio value, profit/loss, daily/weekly returns). This keeps your logic centralized and easy to test.
*   **Implement a Testing Suite:** Write unit tests for your calculation service to ensure financial accuracy. Use E2E tests with Playwright or Cypress to simulate user flows like adding a new gold purchase, selling a fund, and verifying the portfolio value updates correctly.
*   **Enhance Error Handling:** When you start integrating external APIs for prices, implement robust error handling to manage cases where an API is down or returns invalid data, so the user's portfolio display doesn't break.

### 7. Roadmap for extension: from starter to your vision

This starter is the first 30% of your project. Here’s a potential roadmap for the remaining 70%, turning it into your full-featured application:

1.  **Phase 1: Core Manual Tracker**
    *   **Database Modeling:** Define and migrate Drizzle schemas for `Users`, `Assets` (with types like gold, stock, fund), and `Transactions` (buy/sell actions with price, quantity, date).
    *   **UI for CRUD:** Build the forms (`Modal` or new page) for users to manually add, edit, and delete their transactions.
    *   **Core Logic:** Implement the business logic to display the aggregated portfolio view and the detailed, transaction-level view for each asset. Implement the specific sell logic (user-selectable lots for stocks/metals, FIFO for funds).

2.  **Phase 2: Automation & Visualization**
    *   **API Service Layer:** Create a service in `lib/` to fetch real-time prices for stocks, funds (TEFAS), and commodities. Use Next.js API routes to securely call these services from the client.
    *   **Data Visualization:** Integrate a charting library (e.g., Recharts, Chart.js) into your dashboard to display the daily/weekly bar charts and the monthly/yearly performance graphs.
    *   **Multi-Currency View:** Add an API for currency exchange rates (e.g., USD/TRY). Implement a toggle on the front-end that applies the conversion to all monetary values displayed.

3.  **Phase 3: Advanced Features & Monetization**
    *   **Push Notifications:** For the "Today your portfolio grew by X%" feature, set up a daily cron job (e.g., Vercel Cron Jobs) that calculates each user's portfolio change. Integrate a push notification service to send the alerts.
    *   **Freemium Model:** Extend the `auth` schema with a `user_role` or `subscription_status` field. Use this field to conditionally render "premium" indicators or features within the UI.
    *   **Mobile Transition:** The responsive nature of Next.js and Tailwind CSS means your web app will work well on mobile browsers. For a native app experience later, you can wrap the web app in a WebView container (using Capacitor/Tauri) or rebuild the UI in React Native, reusing your API and business logic.

## CodeGuide CLI Usage Instructions

This project is managed using CodeGuide CLI. The AI agent should follow these guidelines when working on this project.

### Essential Commands

#### Project Setup & Initialization
```bash
# Login to CodeGuide (first time setup)
codeguide login

# Start a new project (generates title, outline, docs, tasks)
codeguide start "project description prompt"

# Initialize current directory with CLI documentation
codeguide init
```

#### Task Management
```bash
# List all tasks
codeguide task list

# List tasks by status
codeguide task list --status pending
codeguide task list --status in_progress
codeguide task list --status completed

# Start working on a task
codeguide task start <task_id>

# Update task with AI results
codeguide task update <task_id> "completion summary or AI results"

# Update task status
codeguide task update <task_id> --status completed
```

#### Documentation Generation
```bash
# Generate documentation for current project
codeguide generate

# Generate documentation with custom prompt
codeguide generate --prompt "specific documentation request"

# Generate documentation for current codebase
codeguide generate --current-codebase
```

#### Project Analysis
```bash
# Analyze current project structure
codeguide analyze

# Check API health
codeguide health
```

### Workflow Guidelines

1. **Before Starting Work:**
   - Run `codeguide task list` to understand current tasks
   - Identify appropriate task to work on
   - Use `codeguide task update <task_id> --status in_progress` to begin work

2. **During Development:**
   - Follow the task requirements and scope
   - Update progress using `codeguide task update <task_id>` when significant milestones are reached
   - Generate documentation for new features using `codeguide generate`

3. **Completing Work:**
   - Update task with completion summary: `codeguide task update <task_id> "completed work summary"`
   - Mark task as completed: `codeguide task update <task_id> --status completed`
   - Generate any necessary documentation

### AI Agent Best Practices

- **Task Focus**: Work on one task at a time as indicated by the task management system
- **Documentation**: Always generate documentation for new features and significant changes
- **Communication**: Provide clear, concise updates when marking task progress
- **Quality**: Follow existing code patterns and conventions in the project
- **Testing**: Ensure all changes are properly tested before marking tasks complete

### Project Configuration
This project includes:
- `codeguide.json`: Project configuration with ID and metadata
- `documentation/`: Generated project documentation
- `AGENTS.md`: AI agent guidelines

### Getting Help
Use `codeguide --help` or `codeguide <command> --help` for detailed command information.

---
*Generated by CodeGuide CLI on 2025-10-12T15:39:26.908Z*

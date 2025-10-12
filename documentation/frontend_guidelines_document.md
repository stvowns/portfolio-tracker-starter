# Frontend Guideline Document for Portfolio Tracker Starter

This document outlines the frontend architecture, design principles, and technologies used in the Portfolio Tracker Starter. It’s written in plain language so anyone can understand how the frontend is set up, why we made certain choices, and how to maintain and extend it.

## 1. Frontend Architecture

### Overview
- **Framework:** Next.js (App Router) provides server-side rendering (SSR), static site generation (SSG), and API routes. This gives us fast page loads and built-in backend endpoints.
- **Language:** TypeScript ensures type safety, catching errors early and making complex data structures (like financial transactions) reliable.
- **UI Library:** `shadcn/ui` supplies pre-built components (Cards, Data Tables, Inputs, Buttons) styled in a modern “New York” aesthetic.
- **Styling:** Tailwind CSS v4 offers utility-first, atomic classes for rapid, consistent styling.
- **Authentication:** Better Auth handles sign-up, sign-in, and session management out of the box.
- **Database & ORM:** Drizzle ORM with PostgreSQL delivers a type-safe, relational database layer for assets, portfolios, and transactions.
- **Deployment:** Docker (with `Dockerfile` and `docker-compose.yml`) for consistent local and production environments.

### Scalability, Maintainability & Performance
- **Scalability:** File-based routing and modular API routes allow easy addition of new pages and services (e.g., price-feed endpoints). Components and hooks are organized by feature.
- **Maintainability:** TypeScript types and a component-driven structure keep code predictable and reusable. Business logic lives in `lib/`, UI in `components/`, and data schemas in `db/schema/`.
- **Performance:** SSR/SSG and incremental static regeneration (ISR) speed up page loads. Tailwind’s JIT compiler strips unused CSS. Built-in Next.js image and asset optimizations reduce bundle size.

## 2. Design Principles

- **Usability:** Interfaces are intuitive—forms clearly label fields, buttons follow predictable patterns, and feedback (loading states, error messages) guides the user.
- **Accessibility:** Components follow ARIA best practices. Semantic HTML, proper color contrast, and keyboard navigation support are mandatory.
- **Responsiveness:** Mobile-first breakpoints in Tailwind ensure layouts adapt gracefully from small phones to large desktops.
- **Consistency:** A shared theme (colors, typography, spacing) makes the app feel cohesive. Reusable components prevent visual drift.
- **Clarity:** Data tables, charts, and summaries present portfolio information simply, avoiding clutter.

**Application of Principles:**
- Forms use clear labels and focus states.
- Data Tables include accessible headings and keyboard navigation.
- Dashboard cards rearrange or stack on smaller screens.
- Dark mode ensures readability in low-light environments.

## 3. Styling and Theming

### Styling Approach
- **Methodology:** Utility-first with Tailwind CSS. Custom component styles live in `components/` alongside JSX, keeping markup and styling close.
- **No Pre-processors:** Tailwind’s configuration file (`tailwind.config.js`) defines colors, breakpoints, and plugins.

### Theming
- **Dark Mode:** Class-based approach (`class="dark"` on `<html>`). Tailwind’s `dark:` variants swap colors.
- **Theme Configuration:** Centralized in `tailwind.config.js` under `theme.extend`, making it easy to tweak palettes.

### Visual Style
- **Overall Style:** Modern flat design with subtle glassmorphism accents on cards (light blur background, soft shadows).
- **Color Palette:**
  • Primary: #0EA5E9 (Sky Blue)
  • Secondary: #10B981 (Emerald)
  • Accent: #8B5CF6 (Violet)
  • Neutral 100: #F9FAFB (Light)
  • Neutral 800: #1F2937 (Dark Surface)
  • Background Light: #FFFFFF
  • Background Dark: #111827
  • Error: #EF4444 (Red)
  • Success: #22C55E (Green)

- **Typography:**
  • Font Family: “Inter”, system-sans serif fallback
  • Headings: 600 weight for clear hierarchy
  • Body: 400 weight for readability
  • Line-height: 1.5 for text blocks

## 4. Component Structure

### Organization
- **app/**: Contains page files and layouts (e.g., `app/dashboard/`).
- **components/**: Reusable UI parts (DataTable, Card, Modal, Button).
- **lib/**: Business logic (portfolio calculations, API clients).
- **db/schema/**: Drizzle ORM schema definitions (auth, assets, transactions).

### Reuse and Maintainability
- Each component lives in its own folder with a clear name (e.g., `components/AddTransactionModal/`).
- Props interfaces define inputs and callbacks, making components predictable.
- Shared hooks (e.g., `usePortfolio()`) centralize data fetching logic.

**Benefits:**
- Quick onboarding for new developers.
- Easier testing and debugging.
- Isolation prevents unintended style or state leaks.

## 5. State Management

- **Local UI State:** React hooks (`useState`, `useReducer`) handle open/close modals, form values, and other view-specific states.
- **Server State:** React Query (recommended out of the box) manages data fetching, caching, and background updates for price feeds and portfolio data.
- **Global State:** React Context API holds theme (light/dark) and authentication status (session) so components can read user info or theme without prop drilling.

**Flow:**
1. On page load, a query fetches user portfolio via Next.js API route.
2. React Query caches and shares data across components (Charts, Tables).
3. UI events (e.g., adding a transaction) invalidate queries, triggering refetch for a fresh view.

## 6. Routing and Navigation

- **Routing Library:** Built-in Next.js App Router uses file-based routing under `app/`.
- **Layouts & Nested Routes:** Shared layouts (e.g., authenticated layout) wrap pages, providing nav bars and footers.
- **Dynamic Routes:** e.g., `app/dashboard/[assetId]/page.tsx` for per-asset details.
- **Navigation Component:** Uses Next.js `<Link>` for client-side transitions with prefetching.

**User Flow:**
1. **/login** → sign in via Better Auth
2. **/dashboard** → overview cards, data table, charts
3. **/dashboard/[assetId]** → detailed transaction list
4. “Add Transaction” opens a modal; on submit, returns to updated dashboard

## 7. Performance Optimization

- **Code Splitting:** Next.js automatically splits pages; heavy components (charts) use `next/dynamic` for lazy loading.
- **Image Optimization:** `next/image` compresses and serves correct sizes.
- **Bundle Analysis:** Periodic checks with `@next/bundle-analyzer` to detect large imports.
- **CSS Tree-Shaking:** Tailwind JIT removes unused styles.
- **API Caching:** Stale-while-revalidate patterns in React Query and Next.js ISR for price-feed endpoints.
- **Docker Multi-Stage Build:** Produces a small production image, speeding deployments.

## 8. Testing and Quality Assurance

- **Unit Tests:** Jest + React Testing Library for components and utility functions (e.g., calculation logic in `lib/`).
- **Integration Tests:** Verify interaction between components and hooks.
- **End-to-End Tests:** Playwright or Cypress simulate user flows: sign in, add transaction, view updated portfolio.
- **Linting & Formatting:** ESLint + Prettier enforce code style and catch common errors.
- **Type Checking:** Run `tsc --noEmit` in CI to ensure no type errors.

**CI/CD Integration:** GitHub Actions or similar runs lint, tests, type checks, and a build on each PR.

## 9. Conclusion and Overall Frontend Summary

This guideline captures the key aspects of our frontend setup:
- A **Next.js + TypeScript** foundation for performance and safety.
- A **component-driven UI** with `shadcn/ui` and Tailwind CSS for rapid, consistent styling.
- **Drizzle ORM + PostgreSQL** for a reliable, type-safe data layer.
- **React Query** and React Context for smooth state management.
- **Accessibility, responsiveness, and usability** baked into our design decisions.
- **Testing, linting, and CI/CD** ensure code quality and reliability.

Together, these choices deliver a scalable, maintainable, and user-friendly portfolio tracker. Developers can confidently build new features—whether it’s live price feeds, advanced charts, or a premium subscription—knowing the frontend architecture is solidly in place.
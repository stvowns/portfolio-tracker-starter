# Frontend Guidelines Document

# Frontend Guideline Document

This document outlines the architecture, design principles, and technologies behind the `ai-planner-assistant` frontend. It is written in clear, everyday language so that anyone—regardless of technical background—can understand how the frontend is set up and why each choice was made.

---

## 1. Frontend Architecture

**Frameworks and Libraries**
- **Next.js 15** (App Router): Provides file-based routing and lets us split code between Server Components (fast initial loads) and Client Components (interactive features).
- **TypeScript**: Adds strong typing to JavaScript, helping us catch errors early and document data structures like `Task`, `Event`, or `Expense`.
- **Tailwind CSS v4** & **shadcn/ui**: A utility-first CSS framework plus a library of pre-built, accessible UI components (cards, buttons, input fields).
- **Better Auth**: Manages user sign-up, sign-in, and session handling in a secure, out-of-the-box way.
- **Drizzle ORM** with **PostgreSQL**: Defines database tables in TypeScript and gives us type-safe queries for user data, tasks, events, and expenses.
- **Docker**: Simplifies local setup by running PostgreSQL and the app in containers with a single command.

**Scalability, Maintainability, Performance**
- **Scalability**: File-based routing and modular folder structure (`app/`, `components/`, `db/`, `lib/`) make it easy to add new pages, API routes, and components without confusion.
- **Maintainability**: TypeScript types and Drizzle schemas ensure code and database stay in sync. Shared UI components keep styling consistent and reduce duplication.
- **Performance**: Server Components render on the server for faster initial page loads, while dynamic imports and code-splitting only load heavy code (like chart libraries) when needed.

---

## 2. Design Principles

**Usability**
- Clear, consistent layouts and navigation.
- Familiar UI patterns (buttons, cards, modals) from shadcn/ui.

**Accessibility**
- Semantic HTML elements (`<button>`, `<nav>`, `<header>`).
- ARIA attributes where needed (e.g., `aria-label` on icon-only buttons).
- Color contrast that meets WCAG AA standards.
- Keyboard-friendly navigation (tab order, focus outlines).

**Responsiveness**
- Mobile-first design using Tailwind’s responsive utilities (`sm:`, `md:`, `lg:`).
- Flexible grid and flex layouts adapt to screen size.
- Touch-friendly targets and spacing on smaller screens.

---

## 3. Styling and Theming

**Styling Approach**
- **Utility-First CSS** with Tailwind v4 for rapid, consistent styling.
- **shadcn/ui** for ready-made, themeable UI primitives.
- No large custom CSS files—styles live alongside components via class names.

**Theming**
- Centralized theme in `tailwind.config.js`.
- Custom color palette (see below).
- Dark mode support via Tailwind’s `dark:` variant (optional to enable later).

**Visual Style**
- **Modern Flat Design** with subtle shadows and rounded corners.
- Light glassmorphism accents on data cards (semi-transparent backgrounds with light blur) to add depth without clutter.

**Color Palette**
- Primary:   indigo-600 (#4F46E5)
- Primary-Light: indigo-300 (#A5B4FC)
- Secondary: emerald-500 (#10B981)
- Accent:    amber-500 (#F59E0B)
- Background: gray-100 (#F3F4F6)
- Surface:    white (#FFFFFF)
- Text Primary: gray-900 (#111827)
- Text Secondary: gray-500 (#6B7280)
- Error:      red-500 (#EF4444)

**Fonts**
- Primary font: **Inter** (system-legible, modern sans-serif).
- Fallbacks: `system-ui`, `-apple-system`, `BlinkMacSystemFont`, `Segoe UI`.

---

## 4. Component Structure

**Organization**
- `components/ui/`: Atoms and molecules from shadcn/ui (Buttons, Inputs, Cards).
- `components/data-table.tsx`, `components/chart-area-interactive.tsx`: Example organisms for tables and charts.
- New feature components go under `components/feature-name/` to keep them grouped.

**Reusability**
- Small, focused components that accept props (e.g., `<Button variant="primary">`).
- Avoid one-off styles—encapsulate repeating patterns in a single component.

**Component-Based Benefits**
- **Maintainability**: Change a component in one place, and all its uses update automatically.
- **Testability**: Easier to write isolated unit tests.
- **Collaboration**: Designers and developers share a common vocabulary (Atoms > Molecules > Organisms).

---

## 5. State Management

**Current Approach**
- **React Hooks** (`useState`, `useEffect`) for local component state (chat input, toggles).
- **Server Components** fetch protected data (calendar events, tasks) via Next.js data fetching methods.

**Data Fetching**
- **SWR** (or React Query) is recommended for client-side data fetching to handle caching, revalidation, and background refresh.

**Future Growth**
- As chat interactions become more complex, consider a lightweight global store like **Zustand** to manage real-time messages and loading states.

---

## 6. Routing and Navigation

**Next.js App Router**
- File-based routes under `app/`.
- **Layouts**: Shared wrappers (`app/layout.tsx`, `app/(auth)/layout.tsx`) for common UI (navigation bars, footers).
- **Route Grouping**: `(auth)/`, `(dashboard)/`, `(chat)/` help isolate related pages and layouts.

**Navigation**
- `<Link>` from `next/link` for client-side transitions.
- Protected routes check session via Better Auth—redirect unauthenticated users to sign-in.

---

## 7. Performance Optimization

- **Server Components** reduce JavaScript bundle size on the client.
- **Dynamic Imports** (`next/dynamic`) for heavy modules (charts, maps).
- **Image Optimization** with `next/image` for responsive, lazy-loaded images.
- **Code Splitting**: Each page only loads the code it needs.
- **HTTP Caching**: Use appropriate cache headers on API routes and CDN settings on production.
- **Docker**: Local dev environment mirrors production, catching environment-related issues early.

---

## 8. Testing and Quality Assurance

**Unit Testing**
- **Jest** + **React Testing Library** for component tests.
- Mock API calls with **MSW** (Mock Service Worker) to simulate chat endpoints.

**Integration Testing**
- Test interactions between components and pages (e.g., chat input → API route → message list update).

**End-to-End (E2E) Testing**
- **Cypress** or **Playwright** to script real user flows (sign-in, send a chat command, see a new task on the dashboard).

**Linting and Formatting**
- **ESLint** with TypeScript rules.
- **Prettier** for consistent code style.
- **Git Hooks** (Husky) to run lint and tests before commits.

**Continuous Integration**
- Configure CI (GitHub Actions or similar) to run lint, type checks, unit and E2E tests on each pull request.

---

## 9. Conclusion and Overall Frontend Summary

The `ai-planner-assistant` frontend uses a modern, modular architecture built on Next.js 15 and TypeScript. It combines utility-first styling (Tailwind), ready-made UI components (shadcn/ui), and type-safe database access (Drizzle ORM) to deliver a responsive, accessible, and high-performance user experience.

Each guideline— from clear design principles to robust testing strategies— ensures we can grow the AI Virtual Assistant with confidence, maintainability, and speed. Unique aspects like Server Components for fast loads, a custom AI chat interface powered by GPT-4o, and Docker-driven developer setup set this project apart and streamline everyone’s workflow.

With these guidelines in hand, new team members and stakeholders can quickly get up to speed, and the codebase will remain organized, performant, and ready for future features. 

Happy coding!

---
**Document Details**
- **Project ID**: 2518caaa-9e53-4baf-9eb4-78aa128bc12b
- **Document ID**: 4e1531b8-2bc2-435d-bb8e-9304399cd6dc
- **Type**: custom
- **Custom Type**: frontend_guidelines_document
- **Status**: completed
- **Generated On**: 2025-10-11T09:53:46.623Z
- **Last Updated**: N/A

# Tech Stack Document

# Tech Stack Document for ai-planner-assistant

This document explains, in everyday language, the technology choices behind the **ai-planner-assistant** starter template. It shows how each piece fits together to build an AI-powered schedule, task, and expense manager with a chat interface.

## 1. Frontend Technologies

These are the tools that run in your user’s web browser, shaping the look and feel of the app and handling interactions.

- **Next.js 15 with the App Router**
  - A React-based framework that makes it easy to split pages into Server Components (for fast initial loads) and Client Components (for interactive parts like the chat).  
- **TypeScript**
  - Adds clear, predictable typing to JavaScript. This helps developers catch mistakes early and defines the shape of your data (events, tasks, expenses) from end to end.  
- **Tailwind CSS v4**
  - A utility-first styling tool that speeds up design with small, composable CSS classes (e.g., `p-4`, `text-gray-700`).  
- **shadcn/ui**
  - A library of ready-to-use UI components (buttons, cards, input fields) built on Tailwind, so you can assemble a polished interface quickly without writing custom CSS.  
- **Optional UI libraries**
  - **react-big-calendar**: A popular calendar component you can plug in for a rich date-grid view in your dashboard.  
  - **chart-area-interactive** or **react-chartjs-2**: For building interactive expense charts and data visualizations.  
- **Client-side State Management**
  - **React `useState` / `useReducer`** for simple state needs.  
  - **Zustand** (optional) if your chat and dashboard grow complex and need a lightweight global store.

**How it enhances UX:**
- Fast, SEO-friendly page loads with Server Components.
- A consistent, attractive design built from well-tested UI blocks.
- Strong type checks that prevent runtime errors and keep interfaces in sync with the data model.

## 2. Backend Technologies

These power the server side of the app, handle data storage, user sessions, and the AI chat logic.

- **Next.js API Routes / Server Actions**
  - Lets you write backend code (e.g., `/api/chat/route.ts`) alongside your frontend, so deployment and routing stay unified.  
- **Better Auth**
  - Manages sign-up, sign-in, session cookies, and protects routes (e.g., dashboard and chat API) so each user only sees their own data.  
- **Drizzle ORM**
  - A type-safe library for defining and querying a PostgreSQL database schema. It ensures your code, data structures, and database tables always match.  
- **PostgreSQL**
  - A reliable, production-grade database for storing users, calendar events, tasks, and expenses.  
- **lib/openai.ts** (custom utility)
  - Encapsulates all calls to the OpenAI GPT-4o API, from building prompts to parsing responses into structured JSON.  

**How it supports functionality:**
1. Users log in via Better Auth and get a session cookie.  
2. Chat messages are sent from the frontend to `/api/chat/route.ts`.  
3. The route checks the session, passes the message to GPT-4o, receives structured instructions (e.g., “createEvent”), and uses Drizzle to update PostgreSQL.  
4. Dashboard pages fetch data (events, tasks, expenses) from the database and render it.

## 3. Infrastructure and Deployment

This covers how the app is hosted, how code changes flow into production, and how the environment is managed.

- **Docker & Docker Compose (local development)**
  - Spins up the app and a PostgreSQL database with one command, ensuring everyone on your team works in the same environment.  
- **Version Control: Git + GitHub**
  - Tracks code changes, enables pull requests, and stores your repository safely in the cloud.  
- **CI/CD: GitHub Actions**
  - Runs automated checks (linting, tests) on every commit and deploys to your hosting provider upon merge.  
- **Hosting Platform: Vercel (recommended)**
  - Optimized for Next.js apps: automatic SSL, global CDN, Serverless Functions for API routes, and easy environment variable management.  
- **Environment Variables**
  - Sensitive keys (e.g., `OPENAI_API_KEY`) are stored securely in your CI/CD and hosting platform settings, not in your code.  
- **Cron / Scheduled Jobs**
  - **Vercel Cron Jobs** or a lightweight scheduler to send reminders or run background tasks (e.g., checking for upcoming events).

**Benefits:**
- Consistent local setup with Docker.  
- Quick code reviews and automated testing with GitHub Actions.  
- Scalable, low-maintenance production hosting on Vercel.  
- Secure handling of secrets and scheduled background work.

## 4. Third-Party Integrations

These external services add powerful features without building them from scratch.

- **OpenAI GPT-4o API**
  - Powers the natural language chat interface, turning your users’ text commands into structured actions (create tasks, schedule events, log expenses).  
- **Better Auth**
  - Offloads the complex work of secure user authentication, social logins (if enabled), and session management.  
- **Vercel Cron Jobs**
  - Runs scheduled checks for reminders and notifications.  
- **(Optional) Email / Notification Service**
  - e.g., SendGrid, Postmark, or Nodemailer for sending reminder emails or push notifications when events approach.  
- **Analytics**
  - e.g., Google Analytics or Plausible to track user engagement, feature usage, and chat activity.

**How they enhance functionality:**
- AI understanding and language processing without maintaining your own ML models.  
- Secure, battle-tested authentication.  
- Automated reminders and real-time insights into how people use your assistant.

## 5. Security and Performance Considerations

Measures to keep user data safe and ensure the app runs smoothly.

Security:
- HTTPS everywhere (automatically provided by Vercel).  
- Session-based auth with **Better Auth**, protecting routes and API endpoints.  
- Role of **TypeScript** and ORM type checks to avoid injection attacks and data mismatches.  
- Environment variables for all secrets (no hard-coded keys).  
- Proper error handling in the chat API to avoid exposing internal details.

Performance:
- **Server Components** for pre-rendering dashboard data, reducing client bundle size.  
- **CDN caching** of static assets (CSS, JS, images) on Vercel.  
- **Incremental loading** of chat history using paginated API calls.  
- **Drizzle ORM optimizations**, such as selecting only needed columns and using indexed queries on `userId` fields.  
- **Docker** ensures dependency consistency, eliminating “it works on my machine” slowdowns.

## 6. Conclusion and Overall Tech Stack Summary

We’ve assembled a modern, type-safe, and scalable stack perfectly suited for building an AI-powered planning assistant:

- **Frontend:** Next.js 15, React, TypeScript, Tailwind CSS, shadcn/ui (plus optional React Calendar and Chart libraries)
- **Backend:** Next.js API Routes, Better Auth, Drizzle ORM, PostgreSQL, and a custom OpenAI client in `lib/openai.ts`
- **Infrastructure:** Docker, GitHub & GitHub Actions, Vercel hosting, environment variables management, and scheduled jobs
- **Integrations:** OpenAI GPT-4o, third-party auth, email/notification services, analytics, and optional cron jobs
- **Security & Performance:** HTTPS, session management, type safety, CDN, Server Components, and database indexing

This combination delivers a unified developer experience and a smooth end-user journey: secure login, natural language planning, and interactive dashboards—all running on a reliable, scalable platform. By using well-supported libraries and services, you can focus on refining your AI prompts, enhancing the chat UX, and expanding your data models, rather than wrestling with boilerplate configuration.

---
**Document Details**
- **Project ID**: 2518caaa-9e53-4baf-9eb4-78aa128bc12b
- **Document ID**: 9153f381-ba34-408b-8ff9-ec9b4cbd1951
- **Type**: custom
- **Custom Type**: tech_stack_document
- **Status**: completed
- **Generated On**: 2025-10-11T09:53:23.476Z
- **Last Updated**: N/A

# Security Guideline Document

# Security Guidelines for Portfolio Tracker Starter

This document provides security best practices tailored to the **portfolio-tracker-starter** Next.js project, ensuring a robust, secure foundation for your multi-asset portfolio tracking application.

---

## 1. Overview & Scope

- **Purpose**: Secure a Next.js + TypeScript starter project with Better Auth, Drizzle ORM, PostgreSQL, Tailwind CSS, and Docker.
- **Audience**: Developers, DevOps engineers, and security reviewers.
- **Goals**:
  - Embed security by design throughout development and deployment.
  - Enforce least privilege and defense‐in‐depth.
  - Protect user data and external integrations.

---

## 2. Authentication & Access Control

### 2.1 Robust Authentication
- Use **Better Auth** with secure defaults; verify that only hashed passwords (bcrypt/Argon2 + unique salt) are stored.
- Enforce strong password policies (min. 12 characters, mixed case, symbols).
- Implement **Multi-Factor Authentication (MFA)** for sensitive actions or premium accounts.

### 2.2 Secure Session Management
- Issue unpredictable session tokens or JWTs signed with a strong secret (HS256/HKDF).
- Validate JWT `alg`, enforce `exp` and `iat` claims; reject tokens with `none` algorithm.
- Store tokens in a secure, HttpOnly, Secure, SameSite=Strict cookie; avoid localStorage for JWTs.
- Enforce idle and absolute session timeouts; provide a logout endpoint that invalidates the session.
- Protect against session fixation by rotating session IDs on login.

### 2.3 Authorization & RBAC
- Define explicit roles (e.g., `user`, `admin`, `premiumUser`).
- Perform server-side authorization checks on every API route and page requiring privileges.
- Do not rely solely on client-side role flags. Verify permissions from the session or token on the server.

---

## 3. Input Handling & Processing

### 3.1 Input Validation & Sanitization
- Treat all inputs (forms, query params, JSON bodies) as untrusted.
- Use a schema validation library (e.g., Zod, Yup) for server-side validation.
- Enforce strict types and length limits on strings, numbers, dates.

### 3.2 Prevent Injection
- Use **Drizzle ORM**’s parameterized queries to prevent SQL injection; avoid string concatenation.
- Sanitize user-provided data before interpolation into any template or HTML.

### 3.3 Cross-Site Scripting (XSS)
- Apply context-aware encoding for data rendered in React components (`{}` escapes by default).
- Use a strict Content Security Policy (CSP) to restrict allowable script sources.

### 3.4 Cross-Site Request Forgery (CSRF)
- Protect state-changing API routes with CSRF tokens (e.g., `csrf` package or Next.js built-in middleware).
- Validate the Origin and Referer headers on each POST/PUT/DELETE request.

### 3.5 Safe Redirects
- Only allow redirects to an explicit allow-list of trusted domains.
- Validate `next` or `redirect` query parameters against that allow-list.

---

## 4. Data Protection & Privacy

### 4.1 Encryption
- Enforce **HTTPS/TLS 1.2+** for all front-end/back-end and database connections.
- At rest, enable database encryption (e.g., AWS RDS encryption, disk-level encryption in Docker volumes).

### 4.2 Secrets Management
- Never hardcode API keys or secrets in code. Use environment variables or a secrets manager (AWS Secrets Manager, Vault).
- Restrict access to secret vaults by IAM roles following the principle of least privilege.

### 4.3 Sensitive Data Handling
- Hash and salt passwords using bcrypt or Argon2.
- Mask or redact PII (user email, identifiers) in logs and error messages.

### 4.4 Secure Database Usage
- Use a dedicated PostgreSQL user with only the required privileges (no superuser).
- Rotate database credentials periodically.

---

## 5. API & Service Security

### 5.1 Secure Communication
- Enforce HTTPS for all API endpoints; redirect HTTP traffic to HTTPS.
- Implement HSTS (`Strict-Transport-Security` header) with `max-age=31536000; includeSubDomains; preload`.

### 5.2 Rate Limiting & Throttling
- Apply per-IP or per-user rate limiting on sensitive routes (login, password reset, transaction endpoints).
- Use a middleware (e.g., `express-rate-limit`, Vercel Edge functions) to mitigate DDoS and brute-force attacks.

### 5.3 CORS Configuration
- Restrict CORS to known, trusted origins only; avoid wildcard `*` in production.
- Pre-flight OPTIONS routes should only allow required methods and headers.

### 5.4 API Versioning & Minimizing Exposure
- Version APIs via URL path (e.g., `/api/v1/transactions`).
- Return only necessary fields in responses; never expose internal IDs or full stack traces.

---

## 6. Web Application Security Hygiene

### 6.1 Security Headers
- Content-Security-Policy: restrict scripts, styles, and connections.
- X-Content-Type-Options: `nosniff`.
- X-Frame-Options: `DENY` or `SAMEORIGIN`.
- Referrer-Policy: `no-referrer-when-downgrade` or stricter.

### 6.2 Secure Cookies
- Set `HttpOnly`, `Secure`, and `SameSite=Strict` on session cookies.

### 6.3 Client-Side Storage
- Avoid storing sensitive tokens or PII in `localStorage` or `sessionStorage`.

### 6.4 Subresource Integrity (SRI)
- Apply SRI hashes on any third-party scripts/styles loaded from a CDN.

---

## 7. Infrastructure & Configuration Management

### 7.1 Docker Hardening
- Use minimal base images (e.g., `node:18-alpine`).
- Run the application as a non-root user inside the container.
- Do not include debugging tools or SSH servers in production images.

### 7.2 Server & TLS Configuration
- Disable weak TLS protocols (SSLv3, TLS 1.0/1.1); enable TLS 1.2+.
- Use strong cipher suites (e.g., ECDHE-RSA-AES256-GCM-SHA384).

### 7.3 Configuration & Secrets
- Separate configurations per environment (development, staging, production).
- Do not commit `.env` files or secret files to source control.

### 7.4 Software Updates
- Regularly update Node.js, Next.js, dependencies, and OS packages.
- Automate vulnerability scanning and patching in CI/CD pipelines.

---

## 8. Dependency & Supply Chain Management

- Use lockfiles (`package-lock.json`) to ensure deterministic installs.
- Integrate automated SCA tools (Dependabot, Snyk) to detect CVEs.
- Minimize dependencies; remove unused packages.
- Vet third-party libraries for active maintenance and known vulnerabilities.

---

## 9. Logging, Monitoring & Incident Response

- Centralize logs (e.g., ELK, Datadog) and mask sensitive data.
- Monitor authentication failures, rate-limit violations, and unusual activity.
- Define an incident response plan: detection, containment, eradication, recovery, and post-mortem.

---

## 10. Testing & CI/CD Security

- Implement unit tests for input validation and business logic (financial calculations).
- Use E2E tests (Playwright/Cypress) to verify secure flows (login, transaction CRUD).
- Scan code for secrets before merge (e.g., Git hooks, pre-commit).
- Enforce code reviews and static analysis (ESLint, TypeScript).
- Secure CI/CD credentials and use ephemeral build environments.

---

**By adhering to these guidelines, you will ensure the portfolio-tracker-starter is secure-by-design, resilient, and ready for a production deployment.**

---
**Document Details**
- **Project ID**: 9996f6d0-22b9-4cb2-a2e4-6f42e720cff0
- **Document ID**: 401ceb6e-dcf8-404a-bdd0-0119fde93d7c
- **Type**: custom
- **Custom Type**: security_guideline_document
- **Status**: completed
- **Generated On**: 2025-10-12T15:24:18.232Z
- **Last Updated**: N/A

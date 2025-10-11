# Security Guideline Document

# Security Guidelines for ai-planner-assistant

This document outlines the mandatory security principles and best practices for the **ai-planner-assistant** codebase, a full-stack Next.js 15 starter template that powers an AI Virtual Assistant. Adhering to these guidelines will ensure your application is secure by design and resilient against common threats.

## 1. Authentication & Access Control

- **Robust Authentication**
  - Leverage the existing Better Auth integration. Ensure all protected routes and API endpoints require a valid session.
  - Enforce secure session cookies with `HttpOnly`, `Secure`, and `SameSite=Strict` attributes.
  - Implement idle and absolute session timeouts (e.g., 30 minutes idle, 24 hours absolute).
- **Password Security**
  - If you extend auth with custom password storage, use bcrypt or Argon2 with unique salts.
  - Enforce strong password policies (minimum length 12, mixture of character classes).
- **Role-Based Access Control (RBAC)**
  - Define user roles (e.g., `user`, `admin`) in your database schema.
  - Enforce server-side authorization checks in every API route (e.g., only owners can modify their tasks/events).
- **Multi-Factor Authentication (MFA)**
  - Consider adding MFA (TOTP or SMS) for sensitive operations (e.g., deleting all user data).

## 2. Input Handling & Processing

- **Validate All Inputs Server-Side**
  - Never trust client-side checks. Use Zod or Joi to validate JSON payloads in `app/api/chat/route.ts` and other endpoints.
- **Prevent Injection Attacks**
  - Use Drizzle ORM’s parameterized queries to avoid SQL injection.
  - Sanitize any free-text fields before storing or displaying them.
- **Template & XSS Protection**
  - When rendering chat messages or calendar entries, use React’s default escaping or a library like `DOMPurify`.
  - Set a strict Content Security Policy (CSP) header to disallow inline scripts and untrusted sources.
- **File Upload Safety** (if applicable)
  - Validate file type, size, and scan for malware.
  - Store uploads outside the Next.js `public/` directory with randomized filenames.

## 3. Data Protection & Privacy

- **Encryption in Transit & at Rest**
  - Enforce HTTPS (TLS 1.2+) on all domains. Use HSTS (`Strict-Transport-Security`) header.
  - For any locally stored files or backups, enable disk-level encryption.
- **Secrets Management**
  - Store `OPENAI_API_KEY`, database credentials, and ephemeral tokens in environment variables.
  - Integrate a secrets manager (AWS Secrets Manager, HashiCorp Vault) for production.
- **Least Privilege Database Access**
  - Create a dedicated PostgreSQL user limited to necessary CRUD operations on your application tables.
- **PII Handling & Privacy**
  - Mask or anonymize sensitive fields (e.g., full names, emails) in logs and error messages.
  - Provide a secure deletion mechanism for user data in compliance with GDPR/CCPA.

## 4. API & Service Security

- **HTTPS Enforcement**
  - Redirect all HTTP traffic to HTTPS. Use `next.config.js` to enforce this in production.
- **Rate Limiting & Throttling**
  - Apply IP-based rate limits on `/api/chat` to mitigate brute-force and DoS attacks (e.g., 100 requests/min).
- **CORS Hardening**
  - Restrict `Access-Control-Allow-Origin` to your front-end domain only.
- **Versioned API Endpoints**
  - Prefix chat endpoints with `/api/v1/chat` to allow safe iteration without breaking clients.

## 5. Web Application Security Hygiene

- **Anti-CSRF**
  - Use NextAuth/Better Auth built-in CSRF tokens for form submissions and state-changing API calls.
- **Security Headers**
  - `Content-Security-Policy`, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer-when-downgrade`.
- **Subresource Integrity (SRI)**
  - Add `integrity` attributes when loading third-party scripts or styles via CDN.
- **Client-Side Storage**
  - Avoid storing sensitive tokens in `localStorage` or `sessionStorage`. Prefer secure HTTP-only cookies.

## 6. Infrastructure & Configuration Management

- **Secure Defaults & Hardening**
  - Disable unused Next.js features in production (`appDir`, experimental flags).
  - Remove debug statements and stack traces from production builds.
- **Container Security**
  - Use minimal base images (e.g., `node:18-alpine`).
  - Separate database and application containers; restrict network access via Docker networks.
- **TLS Configuration**
  - Use strong cipher suites and disable TLSv1.0/1.1.
  - Automate certificate management (e.g., Let’s Encrypt, AWS ACM).
- **Logging & Monitoring**
  - Centralize logs (e.g., ELK, Datadog). Mask PII and set appropriate retention policies.
  - Monitor for anomaly patterns (e.g., repeated failed logins).

## 7. Dependency Management

- **Secure & Minimal Dependencies**
  - Audit all npm packages with `npm audit` and a Software Composition Analysis (SCA) tool.
  - Keep `package-lock.json` checked in to ensure reproducible builds.
- **Regular Updates**
  - Subscribe to vulnerability alerts for critical dependencies (Next.js, React, Drizzle, Tailwind).
  - Schedule periodic dependency upgrade sprints.

---

Adhering to these guidelines will help ensure that your AI-powered planning assistant remains secure, reliable, and compliant as it evolves. Always review new features against these principles and perform regular security testing (e.g., penetration tests, code reviews).

---
**Document Details**
- **Project ID**: 2518caaa-9e53-4baf-9eb4-78aa128bc12b
- **Document ID**: d8aeca56-b854-4031-a029-68c64a30c342
- **Type**: custom
- **Custom Type**: security_guideline_document
- **Status**: completed
- **Generated On**: 2025-10-11T09:52:37.041Z
- **Last Updated**: N/A

# HyperAuth

A lightweight Bun + Hono **application** that demonstrates passwordless (magic link) sign-in, JWT access and refresh cookies, and SQLite-backed token storage. Use it as a reference implementation or starting point rather than as an installable npm package.

## Features

- **Magic link authentication** — Passwordless flow; in development the link is shown in the UI; in production you wire up email delivery yourself.
- **JWT tokens** — Access and refresh tokens signed with HS256 (`jose`).
- **SQLite storage** — Magic-link and blacklist persistence via `bun:sqlite`, with periodic cleanup.
- **CSRF protection** — Login `POST` requires a valid CSRF token from the form.
- **Server-rendered UI** — HTML via [Hono JSX](https://hono.dev/docs/guides/jsx) (no React runtime, no HTMX in this repo).

Rate limiting is **not** implemented yet; the e2e suite includes a skipped placeholder for when it is added.

## Quick Start

```bash
# Install dependencies
bun install

# Optional: copy env template (the app runs with built-in dev defaults without this)
cp .env.example .env

# Start development server
bun dev
```

## Environment Variables

Every variable has a **default** in [`src/utils/env.ts`](src/utils/env.ts), so local development works without a `.env`. **Set explicit values in production**, especially `SECRET_KEY` and `HOST`.

| Variable     | Description                                                                                    |
| ------------ | ---------------------------------------------------------------------------------------------- |
| `SECRET_KEY` | JWT signing key (minimum 32 characters). Dev default is insecure; replace in production.       |
| `HOST`       | Public origin (e.g. `http://localhost:3000`). Used for CORS in production.                     |
| `NODE_ENV`   | `development`, `test`, or `production`.                                                        |
| `PORT`       | HTTP port (default `3000`).                                                                    |
| `APP_NAME`   | Display name (default `HyperAuth`).                                                            |

## Scripts

```bash
bun run dev          # CSS build + Tailwind watch + server watch
bun run server       # Server watch only (e.g. Playwright webServer)
bun run build        # Production CSS + compile server binary
bun run test         # Unit tests
bun run test:e2e     # Playwright (install browsers: bunx playwright install)
bun run check        # typecheck, format:check, lint, test
bun run format       # Prettier write
bun run lint         # ESLint
bun run typecheck    # tsc --noEmit
```

## Authentication Flow

1. User enters email on `/login`
2. Server generates magic link token and stores it in SQLite
3. You implement email sending for production (in development, the magic link is shown in the UI)
4. User opens `/auth/verify?token=...`
5. Server validates the token, sets access + refresh JWT cookies
6. Magic token is blacklisted to prevent replay

## API Endpoints

| Endpoint        | Method        | Description                         |
| --------------- | ------------- | ----------------------------------- |
| `/`             | GET           | Home (requires access cookie)       |
| `/login`        | GET           | Login page                          |
| `/auth/login`   | POST          | Request magic link                  |
| `/auth/verify`  | GET           | Verify magic link token             |
| `/auth/refresh` | GET / POST\*  | Refresh access token                |
| `/auth/logout`  | GET           | Logout and clear cookies            |

\*The refresh route is registered for all methods; GET and POST are what clients typically use.

## Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Framework**: [Hono](https://hono.dev)
- **Database**: SQLite (via `bun:sqlite`)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **JWT**: [jose](https://github.com/panva/jose)

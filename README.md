# HyperAuth

HyperAuth is a Bun + Hono reference app for passwordless auth with magic links.
Small enough to read in one sitting, complete enough to use as a base.

## Philosophy

- Keep auth understandable end to end.
- Prefer explicit server behavior over abstraction.
- Use practical defaults for development, explicit values for production.
- Treat this as an implementation blueprint, not a package.

## Includes

- Magic-link sign-in flow
- Access + refresh JWT cookies (`jose`, HS256)
- SQLite-backed magic-link and blacklist storage (`bun:sqlite`)
- CSRF protection on `POST /auth/login`
- Server-rendered HTML via Hono JSX

Rate limiting is not implemented yet.

## Quick Start

```bash
bun install
cp .env.example .env # optional for local development
bun dev
```

The app runs without `.env` via defaults in `src/utils/env.ts`.
For production, set explicit values for `SECRET_KEY` and `HOST`.

## Runtime Notes

- Stack: Bun, Hono, SQLite (`bun:sqlite`), Tailwind CSS, `jose`
- Defaults come from `src/utils/env.ts`; `.env` is optional in local development
- Set production values explicitly: `SECRET_KEY` (JWT signing key, min 32 chars) and `HOST` (public origin for CORS)
- Other env vars: `NODE_ENV`, `PORT`, `APP_NAME`

## Scripts

- `bun run dev` - CSS + server watch
- `bun run build` - production build
- `bun run test` - unit tests
- `bun run test:e2e` - Playwright tests
- `bun run check` - typecheck + format:check + lint + test

## Auth Flow

1. `GET /login` renders the form and CSRF token.
2. `POST /auth/login` validates email + CSRF and creates a magic-link token.
3. In development, the magic link is shown in the UI; in production, you provide delivery.
4. `GET /auth/verify?token=...` verifies and consumes the magic token.
5. Server sets access + refresh cookies and redirects to `/`.

## Routes (Core)


| Route           | Method | Purpose                                                    |
| --------------- | ------ | ---------------------------------------------------------- |
| `/`             | GET    | Home; redirects to `/login` if no valid access token.      |
| `/login`        | GET    | Sign-in form.                                              |
| `/auth/login`   | POST   | Request magic link.                                        |
| `/auth/verify`  | GET    | Verify magic link and create session cookies.              |
| `/auth/refresh` | POST   | Refresh access token; optional `?redirect=/relative/path`. |
| `/auth/logout`  | GET    | Clear session cookies and logout.                          |


`GET /auth/refresh` returns `405` with `Allow: POST`.
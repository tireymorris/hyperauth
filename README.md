# HyperAuth

A lightweight, secure, generic JWT authentication library built with Bun, Hono, and SQLite.

## Features

- **Magic Link Authentication** - Passwordless authentication flow
- **JWT Tokens** - Secure access and refresh tokens with HS256 signing
- **SQLite Storage** - Persistent token storage with automatic cleanup
- **Rate Limiting** - Built-in protection against brute force attacks
- **CSRF Protection** - Cross-site request forgery prevention
- **HTMX Integration** - Server-rendered UI with modern interactions

## Quick Start

```bash
# Install dependencies
bun install

# Copy environment file and configure
cp .env.example .env

# Start development server
bun dev
```

## Environment Variables

| Variable     | Required | Description                              |
| ------------ | -------- | ---------------------------------------- |
| `SECRET_KEY` | Yes      | JWT signing key (min 32 characters)      |
| `HOST`       | Yes      | Full URL (e.g., `http://localhost:3000`) |
| `NODE_ENV`   | Yes      | `development`, `test`, or `production`   |
| `PORT`       | No       | Server port (default: 3000)              |
| `APP_NAME`   | No       | Application name (default: HyperAuth)    |

## Scripts

```bash
bun dev              # Start dev server with hot reload
bun run server       # Start server with watch mode
bun run test:unit    # Run tests
bun run lint         # Lint code
bun run typecheck    # TypeScript check
bun run precommit    # Run all checks
```

## Authentication Flow

1. User enters email on `/login`
2. Server generates magic link token and stores in SQLite
3. Application developer implements email sending (in development, magic link is displayed in UI)
4. User clicks link → `/auth/verify?token=...`
5. Server validates token, issues access + refresh JWT cookies
6. Magic token is blacklisted to prevent replay

## API Endpoints

| Endpoint        | Method   | Description              |
| --------------- | -------- | ------------------------ |
| `/login`        | GET      | Login page               |
| `/auth/login`   | POST     | Request magic link       |
| `/auth/verify`  | GET      | Verify magic link token  |
| `/auth/refresh` | GET/POST | Refresh access token     |
| `/auth/logout`  | GET      | Logout and clear cookies |

## Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Framework**: [Hono](https://hono.dev)
- **Database**: SQLite (via `bun:sqlite`)
- **Styling**: [Tailwind CSS](https://tailwindcss.com)
- **JWT**: [jose](https://github.com/panva/jose)

## License

MIT

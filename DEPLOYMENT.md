# Deployment Guide

This guide covers deploying HyperAuth to Fly.io.

## Prerequisites

- [Fly CLI](https://fly.io/docs/hands-on/install-flyctl/) installed
- Fly.io account
- [Resend](https://resend.com) API key (for production email)

## Environment Variables

### Required

| Variable | Description |
|----------|-------------|
| `SECRET_KEY` | JWT signing key (min 32 characters) |
| `HOST` | Full production URL |
| `EMAIL_FROM` | Verified sender email |
| `NODE_ENV` | Set to `production` |
| `RESEND_API_KEY` | Resend API key |

### Optional

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | 3000 | Server port |
| `APP_NAME` | HyperAuth | Application name |

## Deploy to Fly.io

### 1. Create App

```bash
fly apps create hyperauth
```

### 2. Set Secrets

```bash
fly secrets set SECRET_KEY="your-secret-key-at-least-32-chars"
fly secrets set HOST="https://hyperauth.fly.dev"
fly secrets set EMAIL_FROM="auth@yourdomain.com"
fly secrets set RESEND_API_KEY="re_your_api_key"
fly secrets set NODE_ENV="production"
```

### 3. Deploy

```bash
fly deploy
```

### 4. Verify

```bash
fly status
fly logs
```

## Docker

Build and run locally:

```bash
docker build -t hyperauth .
docker run -p 3000:3000 \
  -e SECRET_KEY="your-secret-key-at-least-32-chars" \
  -e HOST="http://localhost:3000" \
  -e EMAIL_FROM="auth@localhost" \
  -e NODE_ENV="development" \
  hyperauth
```

## Persistent Storage

The SQLite database (`auth.db`) stores tokens. For Fly.io, consider:

1. **Fly Volumes** - Attach persistent storage
2. **External DB** - Use Turso or other SQLite hosting

To add a volume:

```bash
fly volumes create hyperauth_data --size 1
```

Then update `fly.toml`:

```toml
[mounts]
  source = "hyperauth_data"
  destination = "/data"
```

## Health Check

The server responds to health checks at any endpoint. Fly.io default configuration works out of the box.

## Scaling

HyperAuth is stateless (tokens in SQLite). Scale horizontally:

```bash
fly scale count 2
```

For multi-region deployment, use a distributed SQLite solution like Turso.

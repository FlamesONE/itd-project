# ITD - Social Media Platform

Full-stack social media platform built with modern technologies.

## Tech Stack

**Backend:** Bun, Apollo GraphQL, PostgreSQL, Redis, BullMQ, JWT
**Frontend:** React 19, Vite, TailwindCSS, Apollo Client, Radix UI

## Features

- User authentication (JWT access + refresh tokens)
- Posts, comments, reposts, likes
- Real-time notifications via SSE + Redis Pub/Sub
- Media uploads (images, audio)
- User profiles with banners, emojis, bios
- Content recommendations
- Admin dashboard with analytics
- Anti-bot protection
- Email notifications
- User settings (change email, username, password)
- Report system

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- [Docker](https://docker.com) & Docker Compose

### Development

1. Start databases:

```bash
docker compose up -d
```

2. Setup backend:

```bash
cd backend
cp .env.example .env
bun install
bun run migrate
bun run dev
```

3. Setup frontend:

```bash
cd frontend
cp .env.example .env
bun install
bun run dev
```

### Production

```bash
cp .env.prod.example .env.prod
# Edit .env.prod with your real values
docker compose -f docker-compose.prod.yml up -d
```

## Ports

| Service    | Port |
|------------|------|
| GraphQL API | 4000 |
| SSE Server  | 4001 |
| Upload Server | 4002 |
| Health Check | 4003 |

## Project Structure

```
backend/src/
  domain/           # Business entities & interfaces
  application/      # Use cases
  infrastructure/   # DB, Redis, external services
  interface/        # GraphQL schema, HTTP servers

frontend/src/
  app/              # Router, providers, global styles
  pages/            # Route pages
  features/         # Feature modules
  widgets/          # Composite UI components
  entities/         # Domain types
  shared/           # Utilities, API clients, UI primitives
```

## Scripts

```bash
# Backend
bun run dev          # Dev server with watch
bun run start        # Production start
bun run migrate      # Run DB migrations
bun test             # Run tests

# Frontend
bun run dev          # Vite dev server
bun run build        # Production build
```

## Environment Variables

See `.env.example` files in `backend/` and `frontend/` directories, and `.env.prod.example` in project root for production setup.

## License

MIT

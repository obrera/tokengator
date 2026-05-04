# tokengator

TokenGator lets Discord communities gate access by validating onchain asset ownership.

Under the hood it uses TanStack Start, Hono, oRPC, Better Auth, Drizzle, SQLite/Turso, and shared packages for auth, indexing, and UI.

## Features

- **Authentication** - Better Auth with Discord and Solana sign-in/linking
- **Bun** - Runtime environment
- **Discord bot integration** - API-hosted Discord bot helpers and command registration
- **Drizzle** - TypeScript-first ORM
- **Hono** - Lightweight, performant server framework
- **oRPC** - End-to-end type-safe APIs with OpenAPI integration
- **Oxlint** - Oxlint + Oxfmt (linting & formatting)
- **Shared UI package** - shadcn/ui primitives live in `packages/ui`
- **Solana asset indexing** - Helius-backed ownership indexing and asset group sync
- **SQLite/Turso** - Database engine
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **TanStack Start** - SSR framework with TanStack Router
- **Turborepo** - Optimized monorepo build system
- **TypeScript** - For type safety and improved developer experience

## Getting Started

Clone the repository and install the dependencies:

```bash
git clone https://github.com/tokengator/tokengator.git tokengator
cd tokengator
bun install
```

Then create your local env files and generate any placeholder secrets:

```bash
bun run setup
```

## Database Setup

This project uses SQLite with Drizzle ORM.

1. Start the local SQLite database:

```bash
bun run db:local
```

2. Edit `apps/api/.env` only for the external services you want to exercise, such as Discord OAuth,
   Discord bot startup, or Helius indexing. The generated defaults are enough to start the local
   database, API, and web app.

3. Apply the schema to your database:

```bash
bun run db:migrate
```

Use `bun run db:migrate` for local setup, Docker startup, and shared environments. `bun run db:push` is only for explicit one-off schema syncing against disposable databases.

4. Start the API in one terminal:

```bash
bun run dev:api
```

5. Start the web app in a separate terminal:

```bash
bun run dev:web
```

Open [http://localhost:3001](http://localhost:3001) in your browser to see the web application.
The API is running at [http://localhost:3000](http://localhost:3000).

## Optional Seed Data

The app can run with an empty local database. To add the default local users and organizations,
first set the CLI to talk to your local API:

```bash
bun cli config init
```

Choose `local` (`http://localhost:3000`) when prompted. This stores the API URL used by later
`bun cli ...` commands.

Then, with `bun run dev:api` still running, apply the seed:

```bash
bun run db:seed
```

This reads `scripts/default-dev-seed.json`, signs in as Alice's fixture wallet, and creates the
local users and organizations through the API. The checked-in `apps/api/.env.example` already
includes Alice's wallet in `SOLANA_ADMIN_ADDRESSES`, so the `.env` created by `bun run setup`
works with the default seed.

## Docker

TokenGator can run as a single container where the API also serves the built frontend.

### Local Compose Stack

1. Prepare `apps/api/.env` with the values you need.
   `bun run setup` is the fastest way to generate a local file with a real `BETTER_AUTH_SECRET`.
2. `apps/api/.env.docker` overrides the local topology for the Compose stack.
   This keeps `apps/api/.env` free to point at `turso dev` or split-origin local URLs.
3. Start the stack:

```bash
bun run docker:up
```

Equivalent Compose command:

```bash
docker compose --env-file apps/api/.env --env-file apps/api/.env.docker up --build
```

This brings up:

- `app` on `http://localhost:3000`
- `libsql` as an internal sidecar on `http://libsql:8080`

The Docker override file pins the Compose stack to a single public origin:

- `API_URL=http://localhost:3000`
- `CORS_ORIGINS=http://localhost:3000`
- `WEB_URL=http://localhost:3000`
- `DATABASE_URL=http://libsql:8080`

On startup the app container runs `db:migrate` and then starts the API/frontend server.

### Split-Origin Override

If you still need the frontend to call a separate API origin, set `API_URL` for the app container.
Server-rendered web requests use `API_URL`.
Browser requests use `window.location.origin`.

### Images

The supported image target is `app`, published to:

- `ghcr.io/tokengator/tokengator:latest`

## UI Customization

React web apps in this project share shadcn/ui primitives through `packages/ui`.

- Adjust shadcn aliases or style config in `packages/ui/components.json` and `apps/web/components.json`
- Change design tokens and global styles in `packages/ui/src/styles/globals.css`
- Update shared primitives in `packages/ui/src/components/*`

### Add more shared components

Run this from the project root to add more primitives to the shared UI package:

```bash
bunx shadcn@latest add accordion dialog popover sheet table -c packages/ui
```

Import shared components like this:

```tsx
import { Button } from '@tokengator/ui/components/button'
```

### Add app-specific blocks

If you want to add app-specific blocks instead of shared primitives, run the shadcn CLI from `apps/web`.

## Git Hooks and Formatting

- Format and lint fix: `bun run lint:fix`

## Project Structure

```text
tokengator/
├── apps/
│   ├── api/         # Backend API (Hono, oRPC, Discord bot host)
│   └── web/         # Frontend application (React + TanStack Start)
└── packages/
    ├── api/         # Shared API layer, routers, and server composition
    ├── auth/        # Authentication configuration for Discord and Solana sign-in
    ├── config/      # Shared TypeScript and tooling configuration
    ├── db/          # Database schema, queries, and seed scripts
    ├── discord/     # Discord bot runtime and command helpers
    ├── env/         # Typed environment variable definitions
    ├── indexer/     # Solana ownership indexing utilities and Helius integration
    ├── sdk/         # Shared client SDK for calling the API
    └── ui/          # Shared shadcn/ui components and styles
```

## Available Scripts

- `bun run build`: Build all applications
- `bun run check-types`: Check TypeScript types across all apps
- `bun run ci`: Run the full CI task set locally
- `bun run db:generate`: Generate Drizzle migration files from schema changes
- `bun run db:local`: Start the local SQLite database
- `bun run db:migrate`: Run database migrations
- `bun run db:push`: Push schema changes directly to a database; do not use for normal startup or shared environments
- `bun run db:reset`: Remove the local SQLite database files
- `bun run db:seed`: Seed local development data through the local API
- `bun run db:studio`: Open database studio UI
- `bun run dev`: Start all applications in development mode
- `bun run dev:api`: Start only the API
- `bun run dev:web`: Start only the web application
- `bun run lint`: Run Oxlint and Oxfmt in check mode
- `bun run lint:fix`: Run Oxlint and Oxfmt with auto-fixing
- `bun run setup`: Create local env files and generate placeholder secrets
- `bun run test`: Run the workspace test suite
- `bun run test:e2e`: Run the workspace end-to-end tests
- `bun run test:integration`: Run the workspace integration tests

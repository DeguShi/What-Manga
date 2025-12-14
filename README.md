# What-Manga Tracker

A modern, local-first manga and light novel tracking web application.

## Features

- **Import** - Parse `.txt` files in custom format with 900+ entries
- **List View** - Fast search, filter by status, sort by any column
- **Quick Edit** - +1/-1 buttons for progress, score slider, status toggle
- **Novel Tracking** - Separate progress for manga and light novel
- **Private Notes** - Review notes hidden by default in list view
- **CSV Export** - Download your full list as spreadsheet

## Quick Start

### Prerequisites

- Node.js 18+ (LTS recommended)
- pnpm

### Installation

```bash
# Install dependencies
pnpm install

# Generate Prisma client and create database
pnpm db:generate
pnpm db:push

# Start development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Import Your List

1. Navigate to `/import`
2. Drag and drop your `.txt` file
3. Preview parsed entries
4. Choose import mode (Add/Update/Replace)
5. Click "Import"

## Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `pnpm lint` | Run ESLint |
| `pnpm test` | Run parser unit tests |
| `pnpm db:studio` | Open Prisma Studio |

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript (strict)
- **Styling**: Tailwind CSS
- **Components**: shadcn/ui + Radix UI
- **ORM**: Prisma with SQLite
- **Testing**: Vitest

## TXT Format

The parser supports this format:

```
1- Naruto 
(*72 vol. do mangá + LNs).
{10}

2- One Piece 
(~922º? chap. do mangá).
{9.0}
```

**Status symbols:**
- `~` In progress
- `*` Completed
- `∆` Incomplete
- `?` Uncertain
- `r.π` Dropped/Hiatus

**Score:** `{0..10}` decimal

## Deployment

### Vercel + Neon Postgres

1. Create a Neon database
2. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Set `DATABASE_URL` in Vercel environment
4. Deploy via `vercel` CLI or GitHub integration

## License

MIT
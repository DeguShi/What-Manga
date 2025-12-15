<div align="center">

# 📚 What-Manga

**A manga & light novel tracker built with Next.js 14**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss)](https://tailwindcss.com/)
[![Prisma](https://img.shields.io/badge/Prisma-5.0-2D3748?logo=prisma)](https://www.prisma.io/)

[Features](#features) • [Demo](#demo) • [Getting Started](#getting-started) • [Architecture](#architecture) • [API](#api-reference) • [Deploy](#deployment)

</div>

---

## Overview

What-Manga is a personal manga and light novel tracking application. It features a custom text parser for bulk imports, real-time filtering, and a manga-themed UI with dark mode support.

Built as a full-stack Next.js application with Google OAuth authentication and PostgreSQL database.

> **Why I built this:** I've always kept list-like tracking of all anime I've watched, books I've read, and manga I've read. Ideally, I would save my list somewhere like MyAnimeList or Anime-Planet. However, my list is just too big, so it was not realistic to manually add it there. Therefore, I decided to make this app :)

## Features

### 📥 Smart Import System
- Parse custom `.txt` format
- Auto-detect CSV format for spreadsheet imports
- Preview and validate before committing
- Three import modes: Add, Update, Replace

### 📊 Collection Management
- Real-time search across all entries
- Filter by status (Reading, Completed, Dropped)
- Sort by title, score, or custom index
- Virtual scrolling for large lists

### ✏️ Quick Edit Panel
- +1/-1 buttons for chapter/volume progress
- Score slider (0-10 with decimals)
- Status toggle with visual badges
- Private review notes

### 🎨 UI
- Wine-red accents and warm paper tones
- Custom typography (Space Grotesk + Inter)
- Mobile-first card layout with manga-style left border accents
- Dark/Light/System theme modes
- Smooth Framer Motion animations with spring physics

### ⌨️ Keyboard Shortcuts
- `/` — Focus search input
- `Escape` — Close modals
- `n` — Create new entry

### 🔐 Authentication
- Google OAuth via NextAuth.js v5
- JWT sessions for Edge compatibility
- Admin role system via environment config
- Protected routes with middleware

### 👀 Demo Mode
Non-admin users can explore the app with limited access:
- **10 sample entries** displayed as a demo collection
- **Read-only access** — all editing features are hidden
- **Full UI experience** — view, search, filter, and explore the interface
- Configure admin emails via `ADMIN_EMAILS` environment variable

### 📤 Export Options
- CSV spreadsheet format

---

## Demo

### Light Mode
<img width="576" height="796" alt="Screenshot 2025-12-15 at 19 08 09" src="https://github.com/user-attachments/assets/79588bef-3c7c-495a-be5e-181cbdb43242" />
<img width="1440" height="827" alt="Screenshot 2025-12-15 at 19 08 46" src="https://github.com/user-attachments/assets/50622674-cd8f-468b-92ab-1a15eb07925a" />
### Dark Mode

<img width="576" height="796" alt="Screenshot 2025-12-15 at 19 07 55" src="https://github.com/user-attachments/assets/b5014ceb-d9af-45de-9307-c81b166f3287" />
<img width="1440" height="824" alt="Screenshot 2025-12-15 at 19 08 56" src="https://github.com/user-attachments/assets/4f643f80-f2da-480a-8e91-bf96bdd679fd" />


https://github.com/user-attachments/assets/d81ac733-4d15-40cf-bfa1-cf4231912bb1



https://github.com/user-attachments/assets/d2b2c662-71eb-4f86-b55d-dc581c3ae5ea


---

## Architecture

### System Overview

```mermaid
flowchart TB
    subgraph Client["Client (Browser)"]
        UI[React Components]
        Theme[Theme Provider]
        Session[Session Provider]
    end
    
    subgraph NextJS["Next.js 14 App Router"]
        Pages[Server Components]
        API[API Routes]
        MW[Middleware]
    end
    
    subgraph External["External Services"]
        Google[Google OAuth]
        Neon[(Neon PostgreSQL)]
    end
    
    UI --> Pages
    UI --> API
    MW --> Pages
    MW --> API
    Pages --> Neon
    API --> Neon
    Session --> Google
    MW -.-> Session
```

### Authentication Flow

```mermaid
sequenceDiagram
    participant U as User
    participant M as Middleware
    participant P as Page
    participant A as NextAuth
    participant G as Google
    participant DB as Database

    U->>M: GET /
    M->>M: Check JWT
    alt No Session
        M-->>U: Redirect /auth/signin
        U->>A: Click "Sign in with Google"
        A->>G: OAuth Request
        G-->>A: Auth Code
        A->>DB: Create/Update User
        A-->>U: Set JWT Cookie
        U->>M: GET /
    end
    M->>P: Allow Request
    P->>DB: Fetch Works
    P-->>U: Render Page
```

### Data Model

```mermaid
erDiagram
    User ||--o{ Account : has
    User ||--o{ Session : has
    User ||--o{ Work : owns

    User {
        string id PK
        string email UK
        string name
        string image
    }

    Work {
        string id PK
        string title
        int userIndex
        string status
        float score
        float mangaProgressCurrent
        string mangaProgressUnit
        float novelProgressCurrent
        string reviewNote
        string userId FK
    }

    Account {
        string id PK
        string provider
        string providerAccountId
        string userId FK
    }
```

---

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- PostgreSQL database (local or [Neon](https://neon.tech))
- Google OAuth credentials ([Console](https://console.cloud.google.com))

### Environment Setup

Create `.env` file:

```bash
# Database
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"

# NextAuth
AUTH_SECRET="openssl rand -base64 32"

# Google OAuth
GOOGLE_CLIENT_ID="xxx.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-xxx"

# Admin emails (comma-separated)
ADMIN_EMAILS="you@gmail.com"
```

### Installation

```bash
# Clone repository
git clone https://github.com/DeguShi/What-Manga.git
cd What-Manga

# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma db push

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
What-Manga/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── auth/          # NextAuth handlers
│   │   │   ├── works/         # CRUD endpoints
│   │   │   ├── import/        # Import endpoints
│   │   │   └── export/        # CSV export
│   │   ├── auth/              # Auth pages
│   │   └── page.tsx           # Home page
│   ├── components/            # React components
│   │   ├── ui/               # shadcn/ui primitives
│   │   ├── home-client.tsx   # Main dashboard
│   │   ├── work-list.tsx     # Virtual list
│   │   ├── work-card.tsx     # Mobile card component
│   │   ├── work-detail-panel.tsx
│   │   └── query-provider.tsx # React Query provider
│   ├── hooks/                 # Custom hooks
│   │   ├── use-works.ts      # Data fetching (React Query)
│   │   └── use-keyboard-shortcuts.ts
│   └── lib/                   # Utilities
│       ├── auth.ts           # NextAuth config
│       ├── auth.config.ts    # Edge-compatible config
│       ├── constants.ts      # Status options & colors
│       ├── motion.ts         # Animation presets
│       ├── parser/           # TXT parser
│       └── db.ts             # Prisma client
├── prisma/
│   └── schema.prisma         # Database schema
├── middleware.ts              # Auth middleware
└── package.json
```

---

## API Reference

### Works

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/works` | List works (paginated) |
| `POST` | `/api/works` | Create single work |
| `GET` | `/api/works/[id]` | Get work by ID |
| `PATCH` | `/api/works/[id]` | Update work |
| `DELETE` | `/api/works/[id]` | Delete work |
| `DELETE` | `/api/works/all` | Clear all works |

### Import/Export

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/import` | Parse TXT/CSV file |
| `POST` | `/api/import/commit` | Commit parsed entries |
| `GET` | `/api/export/csv` | Download CSV |
| `GET` | `/api/export/mal` | Download MAL XML |

### Query Parameters

```
GET /api/works?search=naruto&status=COMPLETED&sortBy=score&sortOrder=desc&limit=50
```

---

## Import Format

### TXT Format (Custom)

```
1- Naruto 
(*72 vol. do mangá + LNs).
{10}

2- One Piece 
(~1089º chap. do mangá).
{9.0}

3- Attack on Titan
(∆139º chap. do mangá).
{9.9}
```

**Status Symbols:**
| Symbol | Status |
|--------|--------|
| `*` | Completed |
| `~` | In Progress |
| `∆` | Incomplete |
| `?` | Uncertain |
| `r.π` | Dropped/Hiatus |

### CSV Format

```csv
Index,Title,Status,Score,MangaProgress,NovelProgress,Notes
1,Naruto,COMPLETED,10,72 vol.,,-
2,One Piece,IN_PROGRESS,9.0,1089 ch.,,-
```

---

## Deployment

### Vercel + Neon

1. **Create Neon Database**
   - Sign up at [neon.tech](https://neon.tech)
   - Create project, copy connection string

2. **Deploy to Vercel**
   ```bash
   vercel
   ```

3. **Set Environment Variables**
   - Add all `.env` variables in Vercel dashboard
   - Add `NEXTAUTH_URL` with your production URL

4. **Configure Google OAuth**
   - Add production URL to authorized redirects
   - `https://your-app.vercel.app/api/auth/callback/google`

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest tests |
| `npx prisma studio` | Open database GUI |

---

## Tech Stack

| Category | Technology |
|----------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 3.4 |
| Components | shadcn/ui + Radix UI |
| Animation | Framer Motion |
| Data Fetching | React Query (@tanstack/react-query) |
| Virtual Scroll | @tanstack/react-virtual |
| Database | PostgreSQL (Neon) |
| ORM | Prisma 5 |
| Auth | NextAuth.js v5 |
| Testing | Vitest |
| Deployment | Vercel |

---

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing`)
5. Open a Pull Request

---

## License

MIT © [DeguShi](https://github.com/DeguShi)

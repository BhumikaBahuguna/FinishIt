# FinishIt

FinishIt is a production-quality academic productivity management system focused on task prioritization, habit consistency, analytics, notifications, and calendar synchronization.

The project currently ships as a React + Vite frontend that integrates directly with Supabase (Auth + Postgres) and Google Calendar.

## Core Features

- Public Landing Page with a premium, aesthetic design showcasing the app features
- Task management with CRUD workflows
- Eisenhower matrix prioritization (urgent/important model) with distinct color-coded quadrants
- Overdue task detection and deadline views
- Habit tracking with daily logs and streak calculation
- Dashboard with KPI and operational views
- Analytics snapshots for completion and trend reporting
- Subtle notification engine with a topbar bell widget, dropdown menu, and non-intrusive alerts
- AI Productivity Assistant powered by Groq (LLaMA 3) for personalized task planning and habit analysis
- Google Calendar synchronization for task deadlines

## Tech Stack

- Frontend: React 18, Vite 6, React Router 6
- Data/Auth: Supabase JavaScript client (Auth + PostgREST)
- Database: PostgreSQL (Supabase-managed)
- Linting: ESLint 9 with React, Hooks, and React Refresh plugins

## Documentation Map

- **PROJECT_GUIDE.txt**: High-level overview, architecture, and viva script.
- **CODE_EXPLAINED.txt**: Detailed line-by-line explanation of the entire frontend source code.
- **BACKEND_SUPABASE_GUIDE.txt**: Deep dive into the Supabase PostgreSQL database architecture.
- System architecture: `documentation/architecture/system-architecture.md`
- Database schema documentation: `documentation/database/database-schema.md`
- Deployment guide: `documentation/deployment/vercel-and-supabase.md`
- Project history and older plans: `documentation/project-history/`

## Setup and Installation

### Prerequisites

- Node.js 20 or newer
- npm 10 or newer
- Supabase project (URL + anon key)
- Optional for calendar features: Google OAuth client ID

### 1. Install frontend dependencies

Run from the project root:

```bash
cd frontend
npm install
```

### 2. Configure environment variables

Create frontend/.env from frontend/.env.example and set values:

```env
VITE_APP_NAME=FinishIt
VITE_SUPABASE_URL=YOUR_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
VITE_GOOGLE_CLIENT_ID=YOUR_GOOGLE_OAUTH_CLIENT_ID
VITE_GROQ_API_KEY=YOUR_GROQ_API_KEY
```

### 3. Apply database SQL in Supabase

Run the SQL files in this order using Supabase SQL Editor:

1. `database/schema/tables/001_phase4_core_schema.sql`
2. `database/migrations/001_calendar_task_sync.sql`
3. `database/migrations/002_urgency_importance_boolean.sql`

### 4. Start local development

```bash
npm run dev
```

### 5. Quality checks

```bash
npm run lint
npm run build
```

## Deployment Summary

- Frontend is deployed to Vercel
- Database and authentication are hosted in Supabase
- Full step-by-step deployment instructions are in: documentation/deployment/vercel-and-supabase.md

## Future Improvements (Phase 3)

- **Advanced Calendar Sync**: Complete the two-way Google Calendar integration (sync portion) so that modifying events in Google updates tasks in FinishIt.
- Add Row Level Security (RLS) policies with strict tenant isolation for all tables
- Add server-side business logic layer (Edge Functions or backend service) for sensitive operations

## Project Status

- Phases 1-12 implemented and validated (including full UI redesign and AI Assistant integration)
- Refactoring and documentation cleanup (PROJECT_GUIDE, etc) completed

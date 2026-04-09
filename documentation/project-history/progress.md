# FinishIt — Project Progress Report

> **Generated:** 2026-03-25 | **Phases Completed:** 1–12 | **Status:** Active Development

---

## 📌 1. Project Overview

| Field | Detail |
|---|---|
| **Project Name** | FinishIt |
| **Purpose** | A production-quality academic productivity management system |
| **Problem Solved** | Students and professionals struggle to manage tasks, form consistent habits, track deadlines, and maintain planning discipline. FinishIt integrates task management, habit tracking, deadline notifications, analytics, and calendar synchronization into a single cohesive platform. |
| **Target Users** | Students, academics, and professionals seeking structured productivity workflows |

### Key Features

- **Task Management** — Full CRUD with status lifecycle (pending → in_progress → completed → archived)
- **Eisenhower Matrix Prioritization** — Automated urgent/important classification with 2×2 quadrant sorting
- **Habit Tracking** — Daily/weekly/monthly/custom habits with completion logging and streak calculation
- **Dashboard** — Unified view with KPI stats, overdue alerts, upcoming deadlines, and habit progress
- **Analytics** — Completion statistics, overdue trends (14-day), productivity scores, and streak summaries
- **Notification Engine** — Severity-based alerts (critical/warning/info) for overdue tasks, upcoming deadlines, missed habits, and daily reminders
- **Google Calendar Integration** — OAuth-based deadline syncing with urgency-differentiated reminders
- **Authentication** — Supabase Auth with session persistence, auto-refresh, and profile synchronization

---

## 🧱 2. Architecture

### High-Level Architecture

```
┌──────────────────────────────────────────────────────────┐
│                   Browser (Client SPA)                   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐    │
│  │  UI Layer: React Pages + Reusable Components      │    │
│  └──────────────┬───────────────────────────────────┘    │
│                 │                                        │
│  ┌──────────────▼───────────────────────────────────┐    │
│  │  State Layer: AuthProvider + NotificationProvider  │    │
│  └──────────────┬───────────────────────────────────┘    │
│                 │                                        │
│  ┌──────────────▼───────────────────────────────────┐    │
│  │  Domain Layer: Feature Services                    │    │
│  │  (tasks, habits, analytics, notifications,         │    │
│  │   calendar, dashboard)                             │    │
│  └──────────────┬───────────────────────────────────┘    │
│                 │                                        │
│  ┌──────────────▼───────────────────────────────────┐    │
│  │  Data Access Layer: Supabase JS Client Wrappers    │    │
│  └──────────────┬───────────────────────────────────┘    │
│                 │                                        │
│  ┌──────────────▼───────────────────────────────────┐    │
│  │  Google Calendar API (OAuth 2.0 Token Client)      │    │
│  └──────────────────────────────────────────────────┘    │
└───────────────────────────┬──────────────────────────────┘
                            │ HTTPS (PostgREST + Auth)
                            ▼
┌──────────────────────────────────────────────────────────┐
│               Supabase (Cloud Backend)                   │
│                                                          │
│  ┌──────────────┐    ┌──────────────────────────────┐    │
│  │  Supabase     │    │  PostgreSQL Database          │    │
│  │  Auth         │    │  (6 tables, triggers,         │    │
│  │  (JWT/OAuth)  │    │   indexes, constraints)       │    │
│  └──────────────┘    └──────────────────────────────┘    │
└──────────────────────────────────────────────────────────┘

Deployment:
  ├── Frontend → Vercel (CI/CD)
  └── Backend  → Supabase (Auth + PostgreSQL)
```

### Design Patterns

| Pattern | Where Used |
|---|---|
| **Feature-based architecture** | `src/features/` — each module has its own `pages/`, `services/`, `components/`, `context/`, `providers/`, `hooks/` |
| **Context + Provider** | `AuthProvider`, `NotificationProvider` wrap the app for global state |
| **Protected/Public Route guards** | `ProtectedRoute.jsx`, `PublicRoute.jsx` control navigation based on auth state |
| **Service layer abstraction** | All Supabase queries isolated in `*Api.js` service files |
| **Payload normalization** | `validation.js` validates and normalizes data before persistence |
| **Interval polling** | `NotificationProvider` polls every 60 seconds for notification updates |

---

## 📁 3. File & Folder Structure

```
/FinishIt (project root)
├── README.md                          # Project overview and setup guide
├── phase2_report.md                   # Phase 2 & 3 report document
├── progress.md                        # This file
│
├── frontend/                          # React + Vite SPA
│   ├── index.html                     # HTML entry point
│   ├── package.json                   # Dependencies and scripts
│   ├── vite.config.js                 # Vite build configuration
│   ├── eslint.config.js               # ESLint rules
│   ├── .env / .env.example            # Environment variables
│   │
│   └── src/
│       ├── main.jsx                   # React DOM mount point
│       ├── App.jsx                    # Root component (providers + router)
│       │
│       ├── app/                       # Application infrastructure
│       │   ├── layouts/
│       │   │   └── MainLayout.jsx     # Shell: sidebar + topbar + content
│       │   ├── providers/
│       │   │   └── AppProviders.jsx   # Composes AuthProvider + NotificationProvider
│       │   └── router/
│       │       ├── AppRouter.jsx      # Route definitions for all pages
│       │       ├── ProtectedRoute.jsx # Redirects unauthenticated users
│       │       └── PublicRoute.jsx    # Redirects authenticated users
│       │
│       ├── features/                  # Feature modules
│       │   ├── analytics/
│       │   │   ├── components/        # TaskCompletionStatistics, OverdueTaskTrendChart,
│       │   │   │                      # ProductivityOverviewChart, HabitStreakSummary
│       │   │   ├── pages/
│       │   │   │   └── AnalyticsPage.jsx
│       │   │   └── services/
│       │   │       └── analyticsApi.js
│       │   │
│       │   ├── auth/
│       │   │   ├── context/
│       │   │   │   └── AuthContext.js
│       │   │   ├── hooks/
│       │   │   │   └── useAuth.js
│       │   │   ├── pages/
│       │   │   │   └── LoginPage.jsx
│       │   │   ├── providers/
│       │   │   │   └── AuthProvider.jsx
│       │   │   └── services/
│       │   │       └── userProfileApi.js
│       │   │
│       │   ├── calendar/
│       │   │   ├── components/
│       │   │   │   └── CalendarSyncTable.jsx
│       │   │   ├── pages/
│       │   │   │   └── CalendarIntegrationPage.jsx
│       │   │   └── services/
│       │   │       ├── calendarSyncApi.js
│       │   │       ├── calendarTaskSyncService.js
│       │   │       └── googleCalendarApi.js
│       │   │
│       │   ├── dashboard/
│       │   │   ├── components/        # OverviewStats, PrioritizedTaskSections,
│       │   │   │                      # HabitTrackingOverview, OverdueTaskView,
│       │   │   │                      # UpcomingDeadlinesView
│       │   │   ├── pages/
│       │   │   │   └── DashboardPage.jsx
│       │   │   └── services/
│       │   │       └── dashboardApi.js
│       │   │
│       │   ├── habits/
│       │   │   ├── pages/
│       │   │   │   └── HabitTrackingPage.jsx
│       │   │   └── services/
│       │   │       ├── habitsApi.js
│       │   │       └── habitStreaks.js
│       │   │
│       │   ├── notifications/
│       │   │   ├── components/
│       │   │   │   └── NotificationCenter.jsx
│       │   │   ├── context/
│       │   │   │   └── NotificationContext.js
│       │   │   ├── hooks/
│       │   │   │   └── useNotifications.js
│       │   │   ├── pages/
│       │   │   │   └── NotificationsPage.jsx
│       │   │   ├── providers/
│       │   │   │   └── NotificationProvider.jsx
│       │   │   └── services/
│       │   │       └── notificationEngine.js
│       │   │
│       │   └── tasks/
│       │       ├── pages/
│       │       │   └── TaskManagementPage.jsx
│       │       └── services/
│       │           ├── tasksApi.js
│       │           └── taskPrioritization.js
│       │
│       ├── services/                  # Global service layer
│       │   └── supabase/
│       │       ├── client.js          # Supabase client initialization
│       │       └── authApi.js         # Auth API wrappers
│       │
│       ├── shared/                    # Cross-feature shared code
│       │   ├── components/
│       │   │   ├── navigation/
│       │   │   │   └── AppSidebar.jsx
│       │   │   └── ui/
│       │   │       ├── AppErrorBoundary.jsx
│       │   │       ├── Button.jsx
│       │   │       ├── Card.jsx
│       │   │       └── PageHeader.jsx
│       │   ├── constants/
│       │   ├── hooks/
│       │   ├── lib/
│       │   ├── types/
│       │   └── utils/
│       │       └── validation.js      # Task and habit payload validators
│       │
│       └── styles/
│           ├── main.css               # Global CSS entry
│           ├── base/                  # Base/reset styles
│           └── themes/               # Theme variables
│
├── backend/                           # (Placeholder — planned backend layer)
│   ├── jobs/scheduler/
│   ├── services/calendar/ & notifications/
│   ├── shared/contracts/
│   ├── supabase/config/ & functions/ & scripts/
│   └── tests/contracts/ & functions/ & integration/
│
├── database/                          # SQL definitions
│   ├── schema/
│   │   ├── tables/
│   │   │   └── 001_phase4_core_schema.sql
│   │   ├── enums/
│   │   ├── constraints/
│   │   └── indexes/
│   ├── migrations/
│   │   ├── 001_calendar_task_sync.sql
│   │   └── 002_urgency_importance_boolean.sql
│   ├── triggers/
│   ├── functions/
│   ├── views/
│   ├── policies/
│   ├── procedures/
│   ├── seeds/
│   ├── tests/
│   ├── reports/
│   └── docs/
│
├── configuration/                     # Config scaffolds (backend, CI, deployment, etc.)
│
└── documentation/                     # Technical documentation
    ├── architecture/
    │   └── system-architecture.md
    ├── database/
    │   └── database-schema.md
    └── deployment/
        └── vercel-and-supabase.md
```

---

## 📌 4. Key Files Explanation

### Entry & Infrastructure

| File | Purpose |
|---|---|
| `main.jsx` | Creates the React root, imports global CSS, renders `<App />` inside `StrictMode` |
| `App.jsx` | Composes `AppErrorBoundary` → `AppProviders` → `AppRouter` |
| `AppProviders.jsx` | Nests `AuthProvider` and `NotificationProvider` for global state |
| `AppRouter.jsx` | Defines all routes: `/login` (public), `/dashboard`, `/tasks`, `/habits`, `/analytics`, `/calendar`, `/notifications` (protected) |
| `ProtectedRoute.jsx` | Checks auth session; redirects to `/login` if unauthenticated; shows config error if Supabase is missing |
| `PublicRoute.jsx` | Redirects authenticated users to `/dashboard` |
| `MainLayout.jsx` | Application shell with `AppSidebar`, `NotificationCenter` in topbar, and `<Outlet>` for page content |

### Feature Service Files

| File | Purpose |
|---|---|
| `tasksApi.js` | CRUD operations for tasks via Supabase. Normalizes payloads, auto-records task history on create/update |
| `taskPrioritization.js` | Eisenhower matrix algorithm: classifies tasks into 4 quadrants, sorts by quadrant → deadline → importance |
| `habitsApi.js` | CRUD for habits and habit logs. Supports upsert with `habit_id,log_date` conflict resolution |
| `habitStreaks.js` | Calculates current streak, best streak, and today's completion status from habit log dates |
| `notificationEngine.js` | Generates 4 notification types (upcoming deadline, overdue task, missed habit, daily reminder) with severity ranking |
| `analyticsApi.js` | Builds analytics snapshot: completion stats, overdue trends, productivity overview, habit streak summaries |
| `dashboardApi.js` | Aggregates tasks + habits into a dashboard snapshot with stats, matrix, overdue list, and upcoming deadlines |
| `googleCalendarApi.js` | Google Identity Services OAuth flow, token management, and Calendar API event CRUD |
| `calendarTaskSyncService.js` | Orchestrates task→calendar sync: creates/updates events, records sync state, handles failures |
| `calendarSyncApi.js` | Supabase CRUD for `task_calendar_sync` table |
| `authApi.js` | Wrappers around Supabase Auth: `signInWithPassword`, `signOut`, `getSession`, `subscribeToAuthChanges` |
| `userProfileApi.js` | Ensures a user record exists in `public.users` after authentication (upsert by ID) |

### Shared Utilities

| File | Purpose |
|---|---|
| `validation.js` | Validates and normalizes task and habit payloads. Enforces title length (≤200), valid status/frequency enums, ISO date formats |
| `AppErrorBoundary.jsx` | React error boundary for resilient crash recovery |
| `Button.jsx`, `Card.jsx`, `PageHeader.jsx` | Reusable UI primitives used across all pages |
| `AppSidebar.jsx` | Navigation sidebar with links, blinking dot for unread critical/warning notifications, and sign-out |

### Database Files

| File | Purpose |
|---|---|
| `001_phase4_core_schema.sql` | Core schema: `users`, `tasks`, `habits`, `habit_logs`, `task_history` tables + enums, constraints, indexes, triggers |
| `001_calendar_task_sync.sql` | Migration adding `task_calendar_sync` table for Google Calendar integration |
| `002_urgency_importance_boolean.sql` | Migration converting `urgency`/`importance` from `smallint(1-5)` to `boolean` |

---

## ⚙️ 5. Technologies Used

### Languages
| Language | Usage |
|---|---|
| **JavaScript (ES2022+)** | All frontend application code |
| **JSX** | React component templates |
| **SQL (PostgreSQL)** | Database schema, migrations, triggers |
| **CSS** | Styling (base + themes) |

### Frameworks & Libraries
| Technology | Version | Purpose |
|---|---|---|
| **React** | 18.3.1 | UI component framework |
| **Vite** | 6.0.5 | Build tool and dev server |
| **React Router DOM** | 6.30.1 | Client-side routing |
| **@supabase/supabase-js** | 2.99.1 | Supabase client (Auth + PostgREST) |

### Backend Services
| Service | Purpose |
|---|---|
| **Supabase Auth** | Authentication (email/password), JWT, session management |
| **Supabase PostgreSQL** | Cloud-managed database with PostgREST API |
| **Google Calendar API v3** | External calendar event synchronization |

### Dev Tools
| Tool | Purpose |
|---|---|
| **ESLint 9** | Linting with `react`, `react-hooks`, and `react-refresh` plugins |
| **Git** | Version control |
| **Vercel** | Frontend deployment and CI/CD |
| **npm** | Package management |

---

## 🧩 6. Core Modules & Functions

### 6.1 Task Prioritization (`taskPrioritization.js`)

| Function | Purpose | Input | Output |
|---|---|---|---|
| `isTaskUrgent(task, now)` | Determines if a task is urgent (deadline ≤ 48 hours away) | Task object, current Date | `boolean` |
| `getEisenhowerQuadrant(task, options)` | Classifies task into one of 4 Eisenhower quadrants | Task object | Quadrant string |
| `prioritizeTasks(tasks, options)` | Sorts tasks by quadrant priority → deadline proximity → importance | Array of tasks | Sorted array with quadrant metadata |
| `buildEisenhowerMatrix(tasks)` | Groups prioritized tasks into a 4-quadrant matrix | Array of tasks | Object with 4 arrays |
| `getOverdueTasks(tasks, now)` | Filters tasks past deadline (excluding completed/archived) | Array of tasks | Sorted array with `overdueDays` |

### 6.2 Habit Streak Calculation (`habitStreaks.js`)

| Function | Purpose | Input | Output |
|---|---|---|---|
| `calculateHabitStreaks(logs)` | Computes current streak, best streak, last completed date from logs | Array of habit logs | `{ currentStreak, bestStreak, lastCompletedDate }` |
| `buildHabitProgressByHabit(habits, logs)` | Builds a Map of habit ID → streak + today's status | Habits array, logs array | `Map<habitId, progressObject>` |

### 6.3 Notification Engine (`notificationEngine.js`)

| Function | Purpose |
|---|---|
| `buildUpcomingDeadlineNotifications()` | Alerts for tasks due within 4 hours |
| `buildOverdueTaskNotifications()` | Critical alerts for past-deadline tasks |
| `buildMissedHabitNotifications()` | Warnings for habits not completed per schedule |
| `buildDailyReminderNotification()` | Daily summary of active tasks and pending habits (deduplicated via localStorage) |
| `getNotificationsSnapshot(userId)` | Aggregates all notification types, sorted by severity then recency |

### 6.4 Analytics (`analyticsApi.js`)

| Function | Purpose |
|---|---|
| `buildTaskCompletionStatistics()` | Counts by status + completion rate |
| `buildOverdueTrend()` | 14-day overdue task trend data |
| `buildProductivityOverview()` | 7-day productivity score (tasks×2 + habits) |
| `buildHabitStreakSummaries()` | Per-habit streak ranking + aggregate stats |
| `getAnalyticsSnapshot(userId)` | Full analytics data assembly |

### 6.5 Calendar Sync (`calendarTaskSyncService.js` + `googleCalendarApi.js`)

| Function | Purpose |
|---|---|
| `syncTaskDeadlineToCalendar()` | Creates/updates Google Calendar event for a task, persists sync metadata |
| `createOrUpdateTaskCalendarEvent()` | Google Calendar API `POST`/`PATCH` with reminder overrides |
| `requestAccessToken()` | OAuth token acquisition with expiry tracking |
| `buildReminderOverrides()` | Urgent tasks get 3 reminders (24h, 1h, 10min); non-urgent get 1 (24h) |

### 6.6 Validation (`validation.js`)

| Function | Purpose |
|---|---|
| `validateTaskPayload(input, options)` | Validates title (required, ≤200 chars), status enum, deadline ISO, importance boolean |
| `validateHabitPayload(input, options)` | Validates title (required, ≤200 chars), frequency enum, is_active boolean |
| Both support `{ partial: true }` for update operations (only supplied fields are validated) |

---

## 🔄 7. Data Flow

### Authentication Flow

```
User (Login Page)
    │  email + password
    ▼
Supabase Auth (signInWithPassword)
    │  JWT session
    ▼
AuthProvider (stores session in React state)
    │  session.user
    ▼
ensureUserProfile() → UPSERT into public.users
    │
    ▼
ProtectedRoute (unlocks /dashboard, /tasks, etc.)
```

### Task Lifecycle

```
User (Task Form)
    │  title, description, deadline, importance
    ▼
validateTaskPayload() → normalizeTaskPayload()
    │  validated + normalized payload
    ▼
createTask() / updateTask() → Supabase INSERT/UPDATE on public.tasks
    │  returned task record
    ▼
recordTaskHistory() → INSERT into public.task_history
    │
    ▼
UI State Update (setTasks) → Re-render task list + matrix
```

### Notification Polling Cycle

```
NotificationProvider (60-second interval)
    │
    ▼
getNotificationsSnapshot(userId)
    │  fetch tasks + habits + habit_logs in parallel
    ▼
Build 4 notification categories:
    ├── Upcoming deadlines (≤4 hours out)
    ├── Overdue tasks (past deadline, non-completed)
    ├── Missed habits (not completed per frequency)
    └── Daily reminder (deduplicated via localStorage)
    │
    ▼
Sort by severity (critical > warning > info) → recency
    │
    ▼
Publish to UI state + emit browser Notification API (info only)
```

### Google Calendar Sync Flow

```
User clicks "Sync to Calendar"
    │
    ▼
connectGoogleCalendar() → Google Identity Services OAuth consent
    │  access_token (expires in ~3600s)
    ▼
syncTaskDeadlineToCalendar({ userId, task, existingSyncEntry })
    │
    ▼
buildTaskEventPayload(task) → { summary, description, start, end, reminders }
    │
    ▼
Google Calendar API POST/PATCH → /calendars/primary/events
    │  event.id
    ▼
upsertTaskCalendarSyncEntry() → Supabase UPSERT on task_calendar_sync
    │  sync_status: "synced" or "failed"
    ▼
UI displays sync status in CalendarSyncTable
```

---

## 📊 8. Current Progress

### ✅ Completed (Phases 1–12)

| Area | Status | Details |
|---|---|---|
| **Authentication** | ✅ Complete | Supabase Auth with session persistence, auto-refresh, profile sync |
| **Task CRUD** | ✅ Complete | Create, read, update, delete with validation and history tracking |
| **Eisenhower Matrix** | ✅ Complete | 4-quadrant prioritization with automated urgency detection |
| **Overdue Detection** | ✅ Complete | Filters past-deadline tasks with overdue-day calculation |
| **Habit Tracking** | ✅ Complete | CRUD + daily logs with upsert conflict resolution |
| **Habit Streaks** | ✅ Complete | Current/best streak calculation from date sequences |
| **Dashboard** | ✅ Complete | KPI stats, matrix view, habit overview, overdue/upcoming sections |
| **Analytics** | ✅ Complete | Completion stats, 14-day overdue trend, 7-day productivity score, streak summaries |
| **Notification Engine** | ✅ Complete | 4 notification types, severity sorting, browser notification API, 60s polling |
| **Google Calendar** | ✅ Complete | OAuth flow, event create/update/delete, urgency-based reminders, sync metadata |
| **Database Schema** | ✅ Complete | 6 tables with UUIDs, foreign keys, constraints, indexes, triggers |
| **Route Protection** | ✅ Complete | Protected/public route guards with loading states |
| **UI Components** | ✅ Complete | Reusable Button, Card, PageHeader, Sidebar, ErrorBoundary |
| **Documentation** | ✅ Complete | Architecture, database schema, deployment guide, project report |

### 🔶 Partially Implemented

| Area | Status | Details |
|---|---|---|
| **Backend Layer** | 🔶 Scaffold only | Directory structure exists (`backend/`) but contains no executable code. All business logic runs client-side. |
| **Configuration** | 🔶 Scaffold only | Directory structure for CI, deployment, monitoring, security configs exists but is empty |
| **Database extras** | 🔶 Scaffold only | `triggers/`, `functions/`, `views/`, `policies/`, `procedures/`, `seeds/`, `tests/` directories exist but have no SQL files |
| **RLS Policies** | 🔶 Not implemented | Row Level Security mentioned in docs but no policy SQL defined |

### ❌ Pending / Future

| Area | Details |
|---|---|
| **Row Level Security** | Strict tenant isolation for all Supabase tables |
| **Server-side logic** | Edge Functions or backend service for sensitive operations |
| **E2E Testing** | Auth, task lifecycle, calendar sync journey tests |
| **Unit/Integration Tests** | Service module tests (task, habit, notification, analytics) |
| **Observability** | Structured logging, runtime error telemetry |
| **Email/Push Notifications** | Currently browser-only; email/push channels needed |
| **Recurring Templates** | Recurring task templates and custom habit recurrence rules |
| **Offline Support** | Offline-first sync with conflict resolution |
| **Collaboration** | Role-based multi-user shared productivity teams |
| **Calendar Sync Resilience** | Retry/queue strategy for failed sync operations |

### ⚠️ Known Limitations

1. All business logic runs client-side — no server-side validation layer
2. Google OAuth tokens stored in browser memory only (lost on page refresh)
3. No retry/queue mechanism for failed calendar sync operations
4. Notification polling is interval-based (60s), not real-time (no WebSocket/SSE)
5. `urgency` field in database originally `smallint(1-5)`, migrated to `boolean` — apps must use the new boolean model

---

## 🧠 9. Special Logic / Algorithms

### 9.1 Eisenhower Matrix Prioritization

**Location:** `taskPrioritization.js`

**How it works:**
1. A task is **urgent** if its deadline is within 48 hours or already past
2. A task is **important** if `importance === true`
3. Tasks are classified into 4 quadrants:
   - **Do First** (urgent + important) — Priority 1
   - **Schedule** (important, not urgent) — Priority 2
   - **Delegate** (urgent, not important) — Priority 3
   - **Eliminate** (neither) — Priority 4
4. Sorting: Quadrant priority → deadline proximity → importance flag → creation date (newest first)

### 9.2 Habit Streak Calculation

**Location:** `habitStreaks.js`

**How it works:**
1. Filter only completed logs with valid ISO dates (`YYYY-MM-DD`)
2. Deduplicate and sort dates chronologically
3. **Best streak:** Iterate forwards, count consecutive days (each day = previous + 1). Track maximum run.
4. **Current streak:** Iterate backwards from the most recent date, count consecutive days until a gap is found.
5. Returns `{ currentStreak, bestStreak, lastCompletedDate }`

### 9.3 Productivity Scoring

**Location:** `analyticsApi.js`

```
Daily Score = (tasks completed × 2) + (habits completed × 1)
```

Computed over a rolling 7-day window. The day with the highest score is highlighted as "Best Day."

### 9.4 Notification Severity Ranking

**Location:** `notificationEngine.js`

| Severity | Weight | Notification Types |
|---|---|---|
| `critical` | 3 | Overdue tasks |
| `warning` | 2 | Upcoming deadlines (≤3h), missed habits |
| `info` | 1 | Upcoming deadlines (>3h), daily reminders |

Notifications sorted: severity desc → creation time desc.

### 9.5 Calendar Reminder Strategy

**Location:** `calendarTaskSyncService.js`

| Task Urgency | Reminders |
|---|---|
| **Urgent** (deadline ≤48h) | 24 hours before, 1 hour before, 10 minutes before |
| **Non-urgent** | 24 hours before only |

---

## 🔐 10. API / Routes

### Frontend Routes

| Path | Auth Required | Component | Purpose |
|---|---|---|---|
| `/login` | No | `LoginPage` | Email + password sign-in |
| `/` | Yes | Redirects to `/dashboard` | Default redirect |
| `/dashboard` | Yes | `DashboardPage` | Overview with stats, matrix, habits, deadlines |
| `/tasks` | Yes | `TaskManagementPage` | Task CRUD, overdue list, Eisenhower matrix |
| `/habits` | Yes | `HabitTrackingPage` | Habit creation, daily toggle, streak display |
| `/analytics` | Yes | `AnalyticsPage` | Completion stats, trend charts, productivity scores |
| `/calendar` | Yes | `CalendarIntegrationPage` | Google Calendar connection, sync table |
| `/notifications` | Yes | `NotificationsPage` | Full notification list with read tracking |
| `*` | — | Redirects to `/` | Catch-all |

### Supabase PostgREST Table Operations

| Table | Operations | Notes |
|---|---|---|
| `users` | UPSERT (on login) | Syncs auth user to app profile |
| `tasks` | SELECT, INSERT, UPDATE, DELETE | Filtered by `user_id`, ordered by `created_at desc` |
| `habits` | SELECT, INSERT, UPDATE, DELETE | Filtered by `user_id` |
| `habit_logs` | SELECT, UPSERT | Conflict on `(habit_id, log_date)` |
| `task_history` | INSERT | Audit log on task create/update |
| `task_calendar_sync` | SELECT, UPSERT, DELETE | Conflict on `task_id` |

### Google Calendar API Endpoints Used

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/calendars/primary/events` | Create calendar event from task deadline |
| `PATCH` | `/calendars/primary/events/{eventId}` | Update existing calendar event |
| `DELETE` | `/calendars/primary/events/{eventId}` | Remove calendar event |

### Database Schema Summary

| Table | Columns | Key Constraints |
|---|---|---|
| `users` | `id (UUID PK)`, `name`, `email`, `created_at`, `updated_at` | Unique email, non-blank name, regex email format |
| `tasks` | `id (UUID PK)`, `user_id (FK)`, `title`, `description`, `deadline`, `urgency (bool)`, `importance (bool)`, `status (enum)`, `completed_at`, timestamps | Cascade delete, non-blank title, completed_at consistency |
| `habits` | `id (UUID PK)`, `user_id (FK)`, `title`, `frequency (enum)`, `is_active`, timestamps | Cascade delete, unique title per user |
| `habit_logs` | `id (UUID PK)`, `habit_id (FK)`, `log_date`, `completed`, timestamps | Unique (habit_id, log_date), cascade delete |
| `task_history` | `id (UUID PK)`, `task_id (FK)`, `status (enum)`, `updated_at`, `changed_by_user_id (FK nullable)` | Cascade delete on task, set null on user delete |
| `task_calendar_sync` | `id (UUID PK)`, `task_id (FK unique)`, `user_id (FK)`, `external_event_id`, `sync_status`, `error_message`, `reminder_minutes[]`, `last_synced_at`, timestamps | Status check: pending/synced/failed |

---

*End of progress report. Phases 1–12 completed. Project is actively maintained with a clear roadmap for future enhancements.*

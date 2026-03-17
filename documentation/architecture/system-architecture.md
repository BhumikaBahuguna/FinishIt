# System Architecture

## 1. Architecture Style

FinishIt follows a modular frontend architecture with feature-based boundaries and service-oriented data access.

High-level structure:

- UI Layer: pages and reusable components
- State/Provider Layer: auth and notifications context providers
- Domain Layer: feature services for task, habit, analytics, notification, and calendar logic
- Data Access Layer: Supabase client wrappers and table-level APIs
- Persistence Layer: Supabase Postgres schema and migrations

## 2. Runtime Components

### Frontend App Shell

- React + Vite single-page application
- Route orchestration with React Router
- Protected/public route model
- Shared layout with sidebar navigation and notification center

### Providers

- AuthProvider: session lifecycle, auth actions, profile synchronization
- NotificationProvider: polling, in-memory read state, browser notification dispatch

### Feature Modules

- Auth: login and session gating
- Tasks: CRUD, prioritization, overdue detection, status history
- Habits: CRUD, daily completion logging, streak calculations
- Dashboard: cross-feature aggregate snapshot for operational visibility
- Analytics: trend and KPI snapshots from tasks + habits
- Notifications: event synthesis from task and habit data
- Calendar: Google OAuth + event synchronization and sync status persistence

## 3. Data Flow

### Authentication Flow

1. User signs in through Supabase Auth
2. Session is propagated through AuthProvider
3. Profile sync ensures users table contains canonical user record
4. Protected routes become accessible

### Task and Habit Flow

1. Pages submit actions to feature services
2. Feature services validate payloads
3. Data access services execute Supabase table operations
4. UI refreshes snapshots and recalculates derived views

### Notification Flow

1. NotificationProvider polls notificationEngine on interval
2. notificationEngine reads tasks/habits and derives event notifications
3. Provider merges read status and emits browser notifications when enabled

### Calendar Sync Flow

1. User connects Google Calendar via OAuth token client
2. Task sync service creates/updates calendar events for deadline tasks
3. Sync metadata is persisted to task_calendar_sync table
4. UI displays sync states and errors for each task

## 4. Routing and Access Model

Routes:

- Public: /login
- Protected: /dashboard, /tasks, /habits, /analytics, /notifications, /calendar

Access behavior:

- If Supabase env is missing, protected areas show configuration guidance
- If session/profile is loading, route layer holds rendering until ready
- Unknown paths redirect to application root

## 5. Non-Functional Considerations

### Reliability

- Central payload validation utilities
- Global error boundary for runtime crash containment
- Defensive date parsing and malformed data handling in feature logic

### Maintainability

- Feature-oriented folder boundaries
- Dedicated service modules for domain logic
- Shared UI primitives for consistency

### Performance

- Memoized computed views in pages
- Notification polling guard to prevent overlapping refreshes
- Promise.all and Promise.allSettled usage for aggregate operations

## 6. Current Constraints

- Backend orchestration is client-driven (no dedicated API server yet)
- Security hardening depends on proper Supabase RLS/policies rollout
- Google Calendar token handling is browser session scoped

## 7. Evolution Path

Recommended architecture evolution:

1. Introduce service-side execution for sensitive write paths
2. Add RLS policy test suite and migration governance
3. Add end-to-end automation around auth, sync, and notification journeys
4. Add observability stack for production diagnostics

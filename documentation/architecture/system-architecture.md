# System Architecture

## 1. Architecture Style

FinishIt follows a modular frontend architecture with client-driven backend integration using Supabase.

Layers:

* UI Layer: `pages` (orchestrators), `layouts` (shells), and `components` (reusable blocks)
* State Layer: `providers`, `hooks`, and `context` managing React Context
* Domain Layer: `services` (business logic for tasks, habits, analytics)
* Data Access Layer: Supabase client wrappers (inside `services/supabase`)
* Persistence Layer: Supabase PostgreSQL

---

## 2. Runtime Components

### Frontend App

* React + Vite SPA
* React Router for navigation (`router` folder)
* Protected routes based on auth state

---

### Providers & Global State

* AppProviders: master wrapper
* AuthProvider: manages session and user sync
* NotificationProvider: handles polling and browser notifications
* Hooks: `useAuth` and `useNotifications` for consuming state

---

### Domains & Services

* Tasks: CRUD, prioritization with color-coded Eisenhower Matrix, overdue detection (`tasksApi.js`, `taskPrioritization.js`)
* Habits: logging and streak tracking (`habitsApi.js`, `habitStreaks.js`)
* Dashboard: aggregated insights (`dashboardApi.js`)
* Analytics: trends and KPIs (`analyticsApi.js`)
* Notifications: derived event alerts (`notificationEngine.js`)
* Calendar: Google Calendar sync (`googleCalendarApi.js`, `calendarTaskSyncService.js`)

---

## 3. Data Flow

### Authentication Flow

1. User logs in via Supabase Auth
2. Session stored in AuthProvider
3. User synced into public.users
4. Protected routes unlocked

---

### Task Flow

1. UI (`TaskManagementPage.jsx`) triggers service function
2. Service validates input (`validation.js`)
3. Supabase query executes (`tasksApi.js`)
4. UI updates state

---

### Calendar Sync Flow

1. User connects Google Calendar
2. Tasks with deadlines are synced
3. Sync state stored in task_calendar_sync
4. UI reflects sync status/errors

---

## 4. Routing

* Public: /login
* Protected: /dashboard, /tasks, /habits, /analytics, /calendar

---

## 5. Security Model

* Supabase Auth handles authentication
* Row Level Security ensures data isolation
* No direct cross-user access allowed

---

## 6. Constraints

* Backend logic is client-driven
* Google tokens stored in browser session
* Limited retry logic for sync

---

## 7. Future Evolution

* Introduce backend layer (Edge Functions)
* Add retry + queue system for calendar sync
* Add observability/logging
* Add automated testing

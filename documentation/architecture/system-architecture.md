# System Architecture

## 1. Architecture Style

FinishIt follows a modular frontend architecture with client-driven backend integration using Supabase.

Layers:

* UI Layer: pages and reusable components
* State Layer: Auth and Notification providers
* Domain Layer: feature services (tasks, habits, analytics)
* Data Access Layer: Supabase client wrappers
* Persistence Layer: Supabase PostgreSQL

---

## 2. Runtime Components

### Frontend App

* React + Vite SPA
* React Router for navigation
* Protected routes based on auth state

---

### Providers

* AuthProvider: manages session and user sync
* NotificationProvider: handles polling and browser notifications

---

### Feature Modules

* Tasks: CRUD, prioritization with color-coded Eisenhower Matrix, overdue detection
* Habits: logging and streak tracking
* Dashboard: aggregated insights
* Analytics: trends and KPIs
* Notifications: derived event alerts, topbar bell widget with dropdown menu
* Calendar: Google Calendar sync

---

## 3. Data Flow

### Authentication Flow

1. User logs in via Supabase Auth
2. Session stored in AuthProvider
3. User synced into public.users
4. Protected routes unlocked

---

### Task Flow

1. UI triggers service function
2. Service validates input
3. Supabase query executes
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

## 5. Security Model (NEW)

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

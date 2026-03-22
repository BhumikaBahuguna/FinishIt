# Database Schema Documentation

## 1. Platform and Conventions

* Platform: PostgreSQL (Supabase)
* Identifier strategy: UUID primary keys via gen_random_uuid()
* Time columns: timestamptz with default now()
* Update tracking: shared trigger function public.set_updated_at()

## 2. Enum Types

* task_status: pending, in_progress, completed, archived
* habit_frequency: daily, weekly, monthly, custom

---

## 3. Core Tables

### users

Purpose: Application user profile data synchronized from Supabase Auth users.

Columns:

* id (uuid, PK) → matches auth.users.id
* name (varchar(120), not null)
* email (varchar(255), not null, unique)
* created_at (timestamptz)
* updated_at (timestamptz)

---

### tasks

Purpose: Task entities with prioritization using Eisenhower Matrix (boolean model).

Columns:

* id (uuid, PK)
* user_id (uuid, FK → users.id)
* title (varchar(200), not null)
* description (text)
* deadline (timestamptz)
* urgency (boolean, default false) → true = urgent
* importance (boolean, default false) → true = important
* status (task_status)
* completed_at (timestamptz)
* created_at, updated_at (timestamptz)

Constraints:

* non-blank title
* status/completed_at consistency

Indexes:

* idx_tasks_user_id
* idx_tasks_status
* idx_tasks_deadline
* idx_tasks_user_deadline

---

### habits

Purpose: Recurring habits owned by users.

Columns:

* id (uuid, PK)
* user_id (uuid, FK → users.id)
* title (varchar(200), not null)
* frequency (habit_frequency)
* is_active (boolean)
* created_at, updated_at (timestamptz)

Constraints:

* non-blank title
* unique (user_id, title)

---

### habit_logs

Purpose: Daily completion state per habit.

Columns:

* id (uuid, PK)
* habit_id (uuid, FK → habits.id)
* log_date (date)
* completed (boolean)
* created_at, updated_at (timestamptz)

Constraints:

* unique (habit_id, log_date)

---

### task_history

Purpose: Audit trail for task status changes.

Columns:

* id (uuid, PK)
* task_id (uuid, FK → tasks.id)
* status (task_status)
* updated_at (timestamptz)
* changed_by_user_id (uuid, nullable)

---

## 4. Calendar Integration Table

### task_calendar_sync

Purpose: Tracks synchronization between tasks and Google Calendar.

Columns:

* id (uuid, PK)
* task_id (uuid, FK → tasks.id)
* user_id (uuid, FK → users.id)
* external_event_id (text)
* sync_status (pending | synced | failed)
* error_message (text)
* reminder_minutes (integer[])
* last_synced_at (timestamptz)
* created_at, updated_at (timestamptz)

---

## 5. Security Model (NEW)

* Row Level Security (RLS) must be enabled on all user-owned tables
* Access rule: users can only access their own data

Example policy:

```sql
using (auth.uid() = user_id)
```

---

## 6. Migration Order

1. schema/tables/001_phase4_core_schema.sql
2. migrations/001_calendar_task_sync.sql
3. migrations/002_urgency_importance.sql

---

## 7. Operational Notes

* urgency/importance use boolean model for simplified prioritization
* updated_at managed via triggers
* cascade deletes maintain referential integrity
* task_history should be populated via trigger (recommended)

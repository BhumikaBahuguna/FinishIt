# Database Schema Documentation

## 1. Platform and Conventions

- Platform: PostgreSQL (Supabase)
- Identifier strategy: UUID primary keys via gen_random_uuid()
- Time columns: timestamptz with default now()
- Update tracking: shared trigger function public.set_updated_at()
- Enum types:
  - task_status: pending, in_progress, completed, archived
  - habit_frequency: daily, weekly, monthly, custom

## 2. Core Tables

## users

Purpose: application user profile data synchronized from Supabase Auth users.

Columns:

- id (uuid, PK)
- name (varchar(120), not null)
- email (varchar(255), not null, unique)
- created_at (timestamptz)
- updated_at (timestamptz)

Constraints:

- non-blank name
- email regex format validation
- unique email

## tasks

Purpose: task entities with prioritization metadata and lifecycle state.

Columns:

- id (uuid, PK)
- user_id (uuid, FK -> users.id)
- title (varchar(200), not null)
- description (text)
- deadline (timestamptz)
- urgency (smallint, range 1..5)
- importance (smallint, range 1..5)
- status (task_status)
- completed_at (timestamptz)
- created_at, updated_at (timestamptz)

Constraints:

- non-blank title
- urgency and importance range checks
- status/completed_at consistency check

Indexes:

- idx_tasks_user_id
- idx_tasks_status
- idx_tasks_deadline
- idx_tasks_user_deadline

## habits

Purpose: recurring habits owned by users.

Columns:

- id (uuid, PK)
- user_id (uuid, FK -> users.id)
- title (varchar(200), not null)
- frequency (habit_frequency)
- is_active (boolean)
- created_at, updated_at (timestamptz)

Constraints:

- non-blank title
- unique (user_id, title)

Indexes:

- idx_habits_user_id
- idx_habits_user_active

## habit_logs

Purpose: daily completion state per habit.

Columns:

- id (uuid, PK)
- habit_id (uuid, FK -> habits.id)
- log_date (date, not null)
- completed (boolean)
- created_at, updated_at (timestamptz)

Constraints:

- unique (habit_id, log_date)

Indexes:

- idx_habit_logs_habit_date
- idx_habit_logs_date

## task_history

Purpose: status audit trail for task lifecycle transitions.

Columns:

- id (uuid, PK)
- task_id (uuid, FK -> tasks.id)
- status (task_status)
- updated_at (timestamptz)
- changed_by_user_id (uuid, FK -> users.id, nullable)

Indexes:

- idx_task_history_task_updated
- idx_task_history_status

## 3. Calendar Integration Table

## task_calendar_sync

Purpose: synchronization state between internal tasks and Google Calendar events.

Columns:

- id (uuid, PK)
- task_id (uuid, unique, FK -> tasks.id)
- user_id (uuid, FK -> users.id)
- external_event_id (text)
- sync_status (varchar(20): pending/synced/failed)
- error_message (text)
- reminder_minutes (integer[])
- last_synced_at (timestamptz)
- created_at, updated_at (timestamptz)

Indexes:

- idx_task_calendar_sync_user
- idx_task_calendar_sync_status
- idx_task_calendar_sync_last_synced

## 4. Relationship Summary

- users 1:N tasks
- users 1:N habits
- habits 1:N habit_logs
- tasks 1:N task_history
- tasks 1:1 task_calendar_sync
- users 1:N task_calendar_sync

## 5. Migration and Execution Order

Apply SQL in this order:

1. database/schema/tables/001_phase4_core_schema.sql
2. database/migrations/001_calendar_task_sync.sql

## 6. Operational Notes

- The schema expects profile synchronization from auth users into public.users.
- Cascade deletes remove dependent tasks/habits/logs/history/sync rows when owner entities are deleted.
- updated_at fields are maintained by triggers rather than manual updates.
- For production, enable and test Row Level Security policies across all user-owned tables.

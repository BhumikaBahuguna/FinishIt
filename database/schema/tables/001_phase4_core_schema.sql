-- Phase 4: Core schema for productivity management system
-- Target: PostgreSQL (Supabase-compatible)

create extension if not exists pgcrypto;

do $$
begin
  if not exists (select 1 from pg_type where typname = 'task_status') then
    create type task_status as enum (
      'pending',
      'in_progress',
      'completed',
      'archived'
    );
  end if;

  if not exists (select 1 from pg_type where typname = 'habit_frequency') then
    create type habit_frequency as enum (
      'daily',
      'weekly',
      'monthly',
      'custom'
    );
  end if;
end $$;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null,
  email varchar(255) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_name_not_blank check (length(trim(name)) > 0),
  constraint users_email_format check (
    email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
  ),
  constraint users_email_unique unique (email)
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title varchar(200) not null,
  description text,
  deadline timestamptz,
  urgency smallint not null,
  importance smallint not null,
  status task_status not null default 'pending',
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tasks_user_fk
    foreign key (user_id) references public.users(id) on delete cascade,
  constraint tasks_title_not_blank check (length(trim(title)) > 0),
  constraint tasks_urgency_range check (urgency between 1 and 5),
  constraint tasks_importance_range check (importance between 1 and 5),
  constraint tasks_completed_status_consistency check (
    (status = 'completed' and completed_at is not null)
    or
    (status <> 'completed' and completed_at is null)
  )
);

create table if not exists public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  title varchar(200) not null,
  frequency habit_frequency not null default 'daily',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint habits_user_fk
    foreign key (user_id) references public.users(id) on delete cascade,
  constraint habits_title_not_blank check (length(trim(title)) > 0),
  constraint habits_title_per_user_unique unique (user_id, title)
);

create table if not exists public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  habit_id uuid not null,
  log_date date not null,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint habit_logs_habit_fk
    foreign key (habit_id) references public.habits(id) on delete cascade,
  constraint habit_logs_unique_day unique (habit_id, log_date)
);

create table if not exists public.task_history (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null,
  status task_status not null,
  updated_at timestamptz not null default now(),
  changed_by_user_id uuid,
  constraint task_history_task_fk
    foreign key (task_id) references public.tasks(id) on delete cascade,
  constraint task_history_changed_by_user_fk
    foreign key (changed_by_user_id) references public.users(id) on delete set null
);

create index if not exists idx_tasks_user_id
  on public.tasks(user_id);

create index if not exists idx_tasks_status
  on public.tasks(status);

create index if not exists idx_tasks_deadline
  on public.tasks(deadline);

create index if not exists idx_tasks_user_deadline
  on public.tasks(user_id, deadline);

create index if not exists idx_habits_user_id
  on public.habits(user_id);

create index if not exists idx_habits_user_active
  on public.habits(user_id, is_active);

create index if not exists idx_habit_logs_habit_date
  on public.habit_logs(habit_id, log_date desc);

create index if not exists idx_habit_logs_date
  on public.habit_logs(log_date);

create index if not exists idx_task_history_task_updated
  on public.task_history(task_id, updated_at desc);

create index if not exists idx_task_history_status
  on public.task_history(status);

drop trigger if exists trg_users_set_updated_at on public.users;
create trigger trg_users_set_updated_at
before update on public.users
for each row
execute function public.set_updated_at();

drop trigger if exists trg_tasks_set_updated_at on public.tasks;
create trigger trg_tasks_set_updated_at
before update on public.tasks
for each row
execute function public.set_updated_at();

drop trigger if exists trg_habits_set_updated_at on public.habits;
create trigger trg_habits_set_updated_at
before update on public.habits
for each row
execute function public.set_updated_at();

drop trigger if exists trg_habit_logs_set_updated_at on public.habit_logs;
create trigger trg_habit_logs_set_updated_at
before update on public.habit_logs
for each row
execute function public.set_updated_at();
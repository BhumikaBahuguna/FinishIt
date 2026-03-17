create table if not exists public.task_calendar_sync (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null unique,
  user_id uuid not null,
  external_event_id text,
  sync_status varchar(20) not null default 'pending',
  error_message text,
  reminder_minutes integer[] not null default array[]::integer[],
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint task_calendar_sync_task_fk
    foreign key (task_id) references public.tasks(id) on delete cascade,
  constraint task_calendar_sync_user_fk
    foreign key (user_id) references public.users(id) on delete cascade,
  constraint task_calendar_sync_status_check
    check (sync_status in ('pending', 'synced', 'failed'))
);

create index if not exists idx_task_calendar_sync_user
  on public.task_calendar_sync(user_id);

create index if not exists idx_task_calendar_sync_status
  on public.task_calendar_sync(sync_status);

create index if not exists idx_task_calendar_sync_last_synced
  on public.task_calendar_sync(last_synced_at desc);

drop trigger if exists trg_task_calendar_sync_set_updated_at on public.task_calendar_sync;
create trigger trg_task_calendar_sync_set_updated_at
before update on public.task_calendar_sync
for each row
execute function public.set_updated_at();

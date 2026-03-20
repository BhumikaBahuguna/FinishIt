-- Migration: Convert urgency and importance from smallint (1-5) to boolean
-- urgency: true = urgent (was >= 4), false = not urgent
-- importance: true = important (was >= 3), false = not important

-- Drop existing CHECK constraints
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_urgency_range;
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_importance_range;

-- Convert urgency column from smallint to boolean
ALTER TABLE public.tasks
  ALTER COLUMN urgency TYPE boolean USING (urgency >= 4);

-- Convert importance column from smallint to boolean
ALTER TABLE public.tasks
  ALTER COLUMN importance TYPE boolean USING (importance >= 3);

-- Set sensible defaults
ALTER TABLE public.tasks ALTER COLUMN urgency SET DEFAULT false;
ALTER TABLE public.tasks ALTER COLUMN importance SET DEFAULT false;

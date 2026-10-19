-- Use a dedicated trigger function for the new tables so we never depend on
-- (or collide with) a pre-existing public.set_updated_at().

create or replace function public.touch_generated_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists universities_set_updated_at on public.universities;
create trigger universities_set_updated_at
  before update on public.universities
  for each row execute function public.touch_generated_updated_at();

drop trigger if exists journey_generation_jobs_set_updated_at on public.journey_generation_jobs;
create trigger journey_generation_jobs_set_updated_at
  before update on public.journey_generation_jobs
  for each row execute function public.touch_generated_updated_at();

-- Drop our helper only if nothing else was ever attached to it. If a
-- pre-existing set_updated_at() was here first, this DROP is a no-op (other
-- triggers still depend on it, so RESTRICT keeps it).
do $$
begin
  drop function if exists public.set_updated_at();
exception
  when dependent_objects_still_exist then null;
end;
$$;

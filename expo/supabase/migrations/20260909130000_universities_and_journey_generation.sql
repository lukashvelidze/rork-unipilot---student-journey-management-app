-- Universities + AI journey generation
-- Adds a `universities` catalogue (populated by the generate-journey edge function),
-- links generated route visa types to a university, and adds a job table so the
-- admin console can track the per-university generation fan-out.

--------------------------------------------------------------------------------
-- Helpers
--------------------------------------------------------------------------------

create or replace function public.is_unipilot_admin()
returns boolean
language sql
stable
as $$
  select coalesce((auth.jwt() ->> 'email') ilike '%@unipilot.app', false);
$$;

grant execute on function public.is_unipilot_admin() to anon, authenticated, service_role;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

--------------------------------------------------------------------------------
-- universities
--------------------------------------------------------------------------------

create table if not exists public.universities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  country_code text not null references public.destination_countries(code) on update cascade,
  city text,
  ranking_global integer,
  website text,
  is_featured boolean not null default true,
  is_active boolean not null default true,
  education_levels text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists universities_country_code_idx
  on public.universities (country_code);
create index if not exists universities_featured_idx
  on public.universities (country_code, is_featured)
  where is_active;

drop trigger if exists universities_set_updated_at on public.universities;
create trigger universities_set_updated_at
  before update on public.universities
  for each row execute function public.set_updated_at();

alter table public.universities enable row level security;

drop policy if exists universities_select on public.universities;
create policy universities_select on public.universities
  for select using (true);

drop policy if exists universities_admin_write on public.universities;
create policy universities_admin_write on public.universities
  for all using (public.is_unipilot_admin()) with check (public.is_unipilot_admin());

grant select on public.universities to anon, authenticated;
grant all on public.universities to service_role;

--------------------------------------------------------------------------------
-- visa_types.university_id  (nullable; existing rows unaffected)
--------------------------------------------------------------------------------

alter table public.visa_types
  add column if not exists university_id uuid references public.universities(id) on delete set null;

create index if not exists visa_types_university_id_idx
  on public.visa_types (university_id);

--------------------------------------------------------------------------------
-- journey_generation_jobs
--------------------------------------------------------------------------------

create table if not exists public.journey_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'pending'
    check (status in ('pending','discovering','processing','completed','partial','failed')),
  requested_by uuid references auth.users(id) on delete set null,
  destination_country_code text not null,
  destination_country_name text not null,
  origin_country_code text not null,
  origin_country_name text not null,
  education_level text not null,
  university_limit integer not null default 8,
  requested_universities text[] not null default '{}',
  -- [{ slug, name, city, rankingGlobal, status, routeVisaCode, checklistCount, itemCount, error }]
  universities jsonb not null default '[]'::jsonb,
  current_index integer not null default 0,
  error text,
  summary text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists journey_generation_jobs_created_idx
  on public.journey_generation_jobs (created_at desc);

drop trigger if exists journey_generation_jobs_set_updated_at on public.journey_generation_jobs;
create trigger journey_generation_jobs_set_updated_at
  before update on public.journey_generation_jobs
  for each row execute function public.set_updated_at();

alter table public.journey_generation_jobs enable row level security;

drop policy if exists jgj_admin_all on public.journey_generation_jobs;
create policy jgj_admin_all on public.journey_generation_jobs
  for all using (public.is_unipilot_admin()) with check (public.is_unipilot_admin());

grant select, insert, update on public.journey_generation_jobs to authenticated;
grant all on public.journey_generation_jobs to service_role;

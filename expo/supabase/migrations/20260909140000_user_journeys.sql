-- user_journeys: one row per (user, university) study journey.
-- A user has ONE origin country (profiles.country_origin) but can target several
-- destination countries / universities. profiles.destination_country / visa_type /
-- level_of_study continue to mirror the PRIMARY journey so existing readers keep
-- working; new code reads user_journeys.

create table if not exists public.user_journeys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  university_id uuid references public.universities(id) on delete set null,
  destination_country_code text not null,
  origin_country_code text not null,
  education_level text not null,
  -- matches checklists.visa_type produced by the generate-journey function:
  -- ROUTE_STUDY_<DEST>_<ORIGIN>_<LEVEL>_<UNIVERSITY_SLUG>
  route_visa_code text not null,
  -- the country-level visa the user picked in onboarding (e.g. F1) — fallback
  -- source of checklists when the university route hasn't been generated yet
  country_visa_type text,
  is_primary boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists user_journeys_unique_combo
  on public.user_journeys (user_id, university_id, education_level);
create unique index if not exists user_journeys_one_primary
  on public.user_journeys (user_id) where is_primary;
create index if not exists user_journeys_user_idx
  on public.user_journeys (user_id);

drop trigger if exists user_journeys_set_updated_at on public.user_journeys;
create trigger user_journeys_set_updated_at
  before update on public.user_journeys
  for each row execute function public.touch_generated_updated_at();

alter table public.user_journeys enable row level security;

drop policy if exists user_journeys_owner_all on public.user_journeys;
create policy user_journeys_owner_all on public.user_journeys
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

grant select, insert, update, delete on public.user_journeys to authenticated;
grant all on public.user_journeys to service_role;

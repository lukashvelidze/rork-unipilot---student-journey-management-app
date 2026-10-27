-- Backing data for the redesigned Tasks, Resources, Toolkit, Interview
-- Simulator and Edit Profile screens.

--------------------------------------------------------------------------------
-- profiles: richer student profile (Edit Profile redesign)
--------------------------------------------------------------------------------

alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists date_of_birth date,
  add column if not exists nationality text,
  add column if not exists current_city text,
  add column if not exists phone text,
  add column if not exists current_school text,
  add column if not exists graduation_year integer,
  add column if not exists gpa numeric(4, 2),
  add column if not exists gpa_scale numeric(4, 2),
  -- [{ "type": "IELTS", "score": "7.5" }, ...]
  add column if not exists test_scores jsonb not null default '[]'::jsonb,
  add column if not exists intended_majors text[] not null default '{}',
  add column if not exists target_countries text[] not null default '{}',
  -- yearly budget in USD
  add column if not exists budget_min integer,
  add column if not exists budget_max integer,
  -- e.g. "Fall 2027"
  add column if not exists intake_term text;

--------------------------------------------------------------------------------
-- avatars storage bucket (public read, owner write under <uid>/...)
--------------------------------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

drop policy if exists avatars_public_read on storage.objects;
create policy avatars_public_read on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists avatars_owner_insert on storage.objects;
create policy avatars_owner_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_owner_update on storage.objects;
create policy avatars_owner_update on storage.objects
  for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists avatars_owner_delete on storage.objects;
create policy avatars_owner_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

--------------------------------------------------------------------------------
-- article_bookmarks: "Saved" resources
--------------------------------------------------------------------------------

create table if not exists public.article_bookmarks (
  user_id uuid not null references auth.users(id) on delete cascade,
  article_id uuid not null references public.articles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, article_id)
);

alter table public.article_bookmarks enable row level security;

drop policy if exists article_bookmarks_owner_all on public.article_bookmarks;
create policy article_bookmarks_owner_all on public.article_bookmarks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, delete on public.article_bookmarks to authenticated;
grant all on public.article_bookmarks to service_role;

--------------------------------------------------------------------------------
-- user_tasks: tasks students add themselves (the "+" on Tasks)
--------------------------------------------------------------------------------

create table if not exists public.user_tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  -- the study journey it belongs to; null = applies to every journey
  journey_id uuid references public.user_journeys(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 200),
  notes text,
  due_date date,
  is_completed boolean not null default false,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_tasks_user_idx on public.user_tasks (user_id);

drop trigger if exists user_tasks_set_updated_at on public.user_tasks;
create trigger user_tasks_set_updated_at
  before update on public.user_tasks
  for each row execute function public.touch_generated_updated_at();

alter table public.user_tasks enable row level security;

drop policy if exists user_tasks_owner_all on public.user_tasks;
create policy user_tasks_owner_all on public.user_tasks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

grant select, insert, update, delete on public.user_tasks to authenticated;
grant all on public.user_tasks to service_role;

--------------------------------------------------------------------------------
-- interview_sessions: simulator usage (free-tier counter) and AI feedback
--------------------------------------------------------------------------------

create table if not exists public.interview_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'started'
    check (status in ('started', 'completed', 'scored', 'failed')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  duration_seconds integer,
  -- [{ "role": "agent" | "user", "text": "..." }]
  transcript jsonb not null default '[]'::jsonb,
  score integer check (score between 0 and 10),
  strengths text,
  improvements text,
  created_at timestamptz not null default now()
);

create index if not exists interview_sessions_user_idx
  on public.interview_sessions (user_id, started_at desc);

alter table public.interview_sessions enable row level security;

-- Students can only read their sessions. Sessions are created and scored by
-- the interview-feedback function (service role), which enforces the free-tier
-- session limit.
drop policy if exists interview_sessions_owner_select on public.interview_sessions;
create policy interview_sessions_owner_select on public.interview_sessions
  for select using (auth.uid() = user_id);

grant select on public.interview_sessions to authenticated;
grant all on public.interview_sessions to service_role;

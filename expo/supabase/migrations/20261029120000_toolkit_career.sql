-- Toolkit: AI Resume Feedback and Career Readiness Monitor.

-- Latest AI CV review (written by the interview-feedback function).
create table if not exists public.resume_reviews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  file_name text,
  score integer check (score between 0 and 10),
  summary text,
  strengths text,
  -- [{ "section": "Experience", "issue": "...", "suggestion": "..." }]
  suggestions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists resume_reviews_user_idx
  on public.resume_reviews (user_id, created_at desc);

alter table public.resume_reviews enable row level security;

drop policy if exists resume_reviews_owner_select on public.resume_reviews;
create policy resume_reviews_owner_select on public.resume_reviews
  for select using (auth.uid() = user_id);

drop policy if exists resume_reviews_owner_delete on public.resume_reviews;
create policy resume_reviews_owner_delete on public.resume_reviews
  for delete using (auth.uid() = user_id);

grant select, delete on public.resume_reviews to authenticated;
grant all on public.resume_reviews to service_role;

-- Employability skills the student says they've built (career readiness).
alter table public.profiles
  add column if not exists career_skills text[] not null default '{}';

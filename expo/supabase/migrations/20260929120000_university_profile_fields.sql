-- University profile fields for the onboarding picker and the journey logo strip.
--
--   logo_url / image_url  resolved from Wikipedia (or the site favicon) by the
--                         generate-journey function
--   tagline               one-line highlight, e.g. "Strong in sustainability and life sciences"
--   level_details         facts that differ per education level, keyed by level:
--                         { "masters": { "tuitionMinUsd": 8000, "tuitionMaxUsd": 12000,
--                                        "scholarshipAvailable": true,
--                                        "applicationDeadline": "2027-01-15" } }

alter table public.universities
  add column if not exists logo_url text,
  add column if not exists image_url text,
  add column if not exists tagline text,
  add column if not exists level_details jsonb not null default '{}'::jsonb;

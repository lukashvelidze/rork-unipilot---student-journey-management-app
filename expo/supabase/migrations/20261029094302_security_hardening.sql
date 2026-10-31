-- Security hardening flagged by the Supabase advisor.

--------------------------------------------------------------------------------
-- documents: policies existed but RLS was off, so every student's passports and
-- transcripts were readable through the API. Turn RLS on and add the missing
-- delete policy (the app deletes documents and whole accounts).
--------------------------------------------------------------------------------
drop policy if exists "Users delete their own documents" on public.documents;
create policy "Users delete their own documents" on public.documents
  for delete using (auth.uid() = user_id);

alter table public.documents enable row level security;

--------------------------------------------------------------------------------
-- Shared content: anyone may read it, only admins may change it. Edge functions
-- use the service role, which bypasses RLS.
--------------------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'checklists',
    'checklist_items',
    'visa_types',
    'document_categories',
    'document_category_fields',
    'destination_countries',
    'origin_countries',
    'article_category_map',
    'article_categories',
    'articles'
  ]
  loop
    execute format('alter table public.%I enable row level security', t);
    execute format('drop policy if exists %I on public.%I', t || '_public_read', t);
    execute format('create policy %I on public.%I for select using (true)', t || '_public_read', t);
    execute format('drop policy if exists %I on public.%I', t || '_admin_write', t);
    execute format(
      'create policy %I on public.%I for all using (public.is_unipilot_admin()) with check (public.is_unipilot_admin())',
      t || '_admin_write',
      t
    );
  end loop;
end;
$$;

--------------------------------------------------------------------------------
-- user_with_subscription joins auth.users with Paddle billing data; it must
-- never be readable through the public API.
--------------------------------------------------------------------------------
revoke all on public.user_with_subscription from anon, authenticated;

--------------------------------------------------------------------------------
-- Trigger functions are not meant to be called over RPC.
--------------------------------------------------------------------------------
revoke execute on function public.handle_new_user() from public, anon, authenticated;

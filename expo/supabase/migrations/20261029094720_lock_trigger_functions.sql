-- Trigger functions run with the owner's rights; nobody should call them over RPC.
revoke execute on function public.split_full_name_for_loops() from public, anon, authenticated;
revoke execute on function public.sync_profile_full_name_to_auth() from public, anon, authenticated;
revoke execute on function public.sync_profile_to_auth() from public, anon, authenticated;

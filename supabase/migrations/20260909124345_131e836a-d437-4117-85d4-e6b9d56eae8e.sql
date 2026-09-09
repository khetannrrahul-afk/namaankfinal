create or replace function public.has_any_account()
returns boolean
language sql
stable
security definer
set search_path = public
as $$ select exists (select 1 from public.profiles) $$;

grant execute on function public.has_any_account() to anon, authenticated;
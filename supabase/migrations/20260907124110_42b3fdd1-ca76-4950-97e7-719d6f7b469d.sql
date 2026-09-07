alter table public.sub_admin_bots add column if not exists bot_username text not null default '';

grant select, insert, update on public.sub_admin_bots to authenticated;
create policy "bots_super_admin_only" on public.sub_admin_bots for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

revoke execute on function public.has_role(uuid, public.app_role) from anon, authenticated, public;
revoke execute on function public.handle_new_user() from anon, authenticated, public;
revoke execute on function public.validate_referral_code(text) from public;
revoke execute on function public.username_available(text) from public;
revoke execute on function public.is_super_admin() from anon, public;
revoke execute on function public.is_sub_admin() from anon, public;
revoke execute on function public.my_sub_admin() from anon, public;
grant execute on function public.validate_referral_code(text) to anon, authenticated;
grant execute on function public.username_available(text) to anon, authenticated;
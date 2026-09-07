grant insert, update on public.app_settings to authenticated;
create policy "app_settings_super_admin_write" on public.app_settings for insert to authenticated
  with check (public.is_super_admin());
create policy "app_settings_super_admin_update" on public.app_settings for update to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

grant insert, delete on public.user_roles to authenticated;
create policy "user_roles_super_admin_insert" on public.user_roles for insert to authenticated
  with check (public.is_super_admin());
create policy "user_roles_super_admin_delete" on public.user_roles for delete to authenticated
  using (public.is_super_admin());

grant insert, update on public.notifications to authenticated;
create policy "notifications_insert_for_own_chain" on public.notifications for insert to authenticated
  with check (public.is_super_admin() or recipient_id = auth.uid() or recipient_id = public.my_sub_admin());
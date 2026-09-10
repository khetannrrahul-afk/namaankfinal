-- ============ 1. private schema for internal helpers ============
CREATE SCHEMA IF NOT EXISTS private;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

CREATE OR REPLACE FUNCTION private.is_super_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('super_admin','admin'))
$$;

CREATE OR REPLACE FUNCTION private.is_sub_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'sub_admin')
$$;

CREATE OR REPLACE FUNCTION private.my_sub_admin()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  select referred_by from public.profiles where id = auth.uid()
$$;

REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_super_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.is_sub_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION private.my_sub_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_super_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.is_sub_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION private.my_sub_admin() TO authenticated, service_role;

-- ============ 2. recreate policies against private helpers ============
DROP POLICY IF EXISTS app_settings_public_read ON public.app_settings;
CREATE POLICY app_settings_public_read ON public.app_settings FOR SELECT TO anon, authenticated
USING (is_public OR (auth.uid() IS NOT NULL AND private.is_super_admin()));
DROP POLICY IF EXISTS app_settings_super_admin_update ON public.app_settings;
CREATE POLICY app_settings_super_admin_update ON public.app_settings FOR UPDATE TO authenticated
USING (private.is_super_admin()) WITH CHECK (private.is_super_admin());
DROP POLICY IF EXISTS app_settings_super_admin_write ON public.app_settings;
CREATE POLICY app_settings_super_admin_write ON public.app_settings FOR INSERT TO authenticated
WITH CHECK (private.is_super_admin());

DROP POLICY IF EXISTS messages_select ON public.messages;
CREATE POLICY messages_select ON public.messages FOR SELECT TO authenticated
USING ((sender_id = auth.uid()) OR (recipient_id = auth.uid()) OR private.is_super_admin());

DROP POLICY IF EXISTS submissions_delete_admin ON public.namaank_submissions;
CREATE POLICY submissions_delete_admin ON public.namaank_submissions FOR DELETE TO authenticated
USING (private.is_super_admin());
DROP POLICY IF EXISTS submissions_select ON public.namaank_submissions;
CREATE POLICY submissions_select ON public.namaank_submissions FOR SELECT TO authenticated
USING ((user_id = auth.uid()) OR (sub_admin_id = auth.uid()) OR private.is_super_admin());
DROP POLICY IF EXISTS submissions_update_admin ON public.namaank_submissions;
CREATE POLICY submissions_update_admin ON public.namaank_submissions FOR UPDATE TO authenticated
USING (private.is_super_admin()) WITH CHECK (private.is_super_admin());

DROP POLICY IF EXISTS notifications_insert_for_own_chain ON public.notifications;
CREATE POLICY notifications_insert_for_own_chain ON public.notifications FOR INSERT TO authenticated
WITH CHECK (private.is_super_admin() OR (recipient_id = auth.uid()) OR (recipient_id = private.my_sub_admin()));

DROP POLICY IF EXISTS payments_select ON public.payments;
CREATE POLICY payments_select ON public.payments FOR SELECT TO authenticated
USING ((user_id = auth.uid()) OR (sub_admin_id = auth.uid()) OR private.is_super_admin());

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT TO authenticated
USING ((id = auth.uid()) OR (referred_by = auth.uid()) OR private.is_super_admin());
DROP POLICY IF EXISTS profiles_update_own ON public.profiles;
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE TO authenticated
USING ((id = auth.uid()) OR private.is_super_admin()) WITH CHECK ((id = auth.uid()) OR private.is_super_admin());

DROP POLICY IF EXISTS report_access_select ON public.report_access;
CREATE POLICY report_access_select ON public.report_access FOR SELECT TO authenticated
USING ((user_id = auth.uid()) OR private.is_super_admin() OR (EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = report_access.user_id AND p.referred_by = auth.uid()
)));

DROP POLICY IF EXISTS social_actions_select ON public.social_actions;
CREATE POLICY social_actions_select ON public.social_actions FOR SELECT TO authenticated
USING ((user_id = auth.uid()) OR (sub_admin_id = auth.uid()) OR private.is_super_admin());

DROP POLICY IF EXISTS bots_super_admin_only ON public.sub_admin_bots;
CREATE POLICY bots_super_admin_only ON public.sub_admin_bots FOR ALL TO authenticated
USING (private.is_super_admin()) WITH CHECK (private.is_super_admin());

DROP POLICY IF EXISTS user_roles_select ON public.user_roles;
CREATE POLICY user_roles_select ON public.user_roles FOR SELECT TO authenticated
USING ((user_id = auth.uid()) OR private.is_super_admin());
DROP POLICY IF EXISTS user_roles_super_admin_delete ON public.user_roles;
CREATE POLICY user_roles_super_admin_delete ON public.user_roles FOR DELETE TO authenticated
USING (private.is_super_admin());
DROP POLICY IF EXISTS user_roles_super_admin_insert ON public.user_roles;
CREATE POLICY user_roles_super_admin_insert ON public.user_roles FOR INSERT TO authenticated
WITH CHECK (private.is_super_admin());

-- ============ 3. sub_admins: no more blanket public read ============
DROP POLICY IF EXISTS sub_admins_select_public ON public.sub_admins;
DROP POLICY IF EXISTS sub_admins_update_own ON public.sub_admins;
REVOKE SELECT ON public.sub_admins FROM anon;
GRANT SELECT, UPDATE ON public.sub_admins TO authenticated;
GRANT ALL ON public.sub_admins TO service_role;
CREATE POLICY sub_admins_select_related ON public.sub_admins FOR SELECT TO authenticated
USING ((id = auth.uid()) OR (id = private.my_sub_admin()) OR private.is_super_admin());
CREATE POLICY sub_admins_update_own ON public.sub_admins FOR UPDATE TO authenticated
USING ((id = auth.uid()) OR private.is_super_admin()) WITH CHECK ((id = auth.uid()) OR private.is_super_admin());

-- ============ 4. payments / report_access writes: service role only ============
REVOKE INSERT, UPDATE, DELETE ON public.payments FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE ON public.report_access FROM anon, authenticated;
GRANT ALL ON public.payments TO service_role;
GRANT ALL ON public.report_access TO service_role;

-- ============ 5. old public helpers: drop from exposed API schema ============
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
DROP FUNCTION IF EXISTS public.is_super_admin();
DROP FUNCTION IF EXISTS public.is_sub_admin();
DROP FUNCTION IF EXISTS public.my_sub_admin();
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;

-- keep intentionally public helpers callable, no PUBLIC grant
REVOKE ALL ON FUNCTION public.has_any_account() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.username_available(text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.validate_referral_code(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_any_account() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.username_available(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.validate_referral_code(text) TO anon, authenticated;

-- 1. ADMINS TABLE
CREATE TABLE public.admins (
  id uuid PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  company_name text NOT NULL DEFAULT '',
  username text NOT NULL UNIQUE,
  mobile text NOT NULL DEFAULT '',
  whatsapp text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  is_approved boolean NOT NULL DEFAULT false,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, UPDATE ON public.admins TO authenticated;
GRANT ALL ON public.admins TO service_role;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.sub_admins
  ADD COLUMN admin_id uuid REFERENCES public.admins(id) ON DELETE SET NULL,
  ADD COLUMN whatsapp text NOT NULL DEFAULT '';

CREATE OR REPLACE FUNCTION private.my_admin()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT coalesce(
    (SELECT a.id FROM public.admins a WHERE a.id = auth.uid()),
    (SELECT s.admin_id FROM public.sub_admins s WHERE s.id = auth.uid())
  )
$$;

CREATE POLICY admins_select ON public.admins FOR SELECT TO authenticated
  USING (id = auth.uid() OR private.is_super_admin() OR id = private.my_admin());
CREATE POLICY admins_update ON public.admins FOR UPDATE TO authenticated
  USING (id = auth.uid() OR private.is_super_admin())
  WITH CHECK (id = auth.uid() OR private.is_super_admin());

-- only super admin may flip approval / active
CREATE OR REPLACE FUNCTION public.admins_guard()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF (NEW.is_approved IS DISTINCT FROM OLD.is_approved OR NEW.is_active IS DISTINCT FROM OLD.is_active)
     AND NOT private.is_super_admin() THEN
    RAISE EXCEPTION 'Only super admin can change approval/active status';
  END IF;
  NEW.username := OLD.username;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
CREATE TRIGGER admins_guard_trg BEFORE UPDATE ON public.admins
  FOR EACH ROW EXECUTE FUNCTION public.admins_guard();

-- 3. WHATSAPP CONFIG (super admin only)
CREATE TABLE public.whatsapp_configs (
  id text PRIMARY KEY DEFAULT 'global',
  phone_number_id text NOT NULL DEFAULT '',
  access_token text NOT NULL DEFAULT '',
  is_enabled boolean NOT NULL DEFAULT false,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.whatsapp_configs TO authenticated;
GRANT ALL ON public.whatsapp_configs TO service_role;
ALTER TABLE public.whatsapp_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY wa_super_only ON public.whatsapp_configs FOR ALL TO authenticated
  USING (private.is_super_admin()) WITH CHECK (private.is_super_admin());

-- 4. VISIBILITY: admin sees its chain
DROP POLICY IF EXISTS sub_admins_select_related ON public.sub_admins;
CREATE POLICY sub_admins_select_related ON public.sub_admins FOR SELECT TO authenticated
  USING (id = auth.uid() OR id = private.my_sub_admin() OR admin_id = auth.uid() OR private.is_super_admin());

DROP POLICY IF EXISTS sub_admins_update_own ON public.sub_admins;
CREATE POLICY sub_admins_update_own ON public.sub_admins FOR UPDATE TO authenticated
  USING (id = auth.uid() OR admin_id = auth.uid() OR private.is_super_admin())
  WITH CHECK (id = auth.uid() OR admin_id = auth.uid() OR private.is_super_admin());

DROP POLICY IF EXISTS profiles_select_own ON public.profiles;
CREATE POLICY profiles_select_own ON public.profiles FOR SELECT TO authenticated
  USING (
    id = auth.uid()
    OR referred_by = auth.uid()
    OR private.is_super_admin()
    OR EXISTS (SELECT 1 FROM public.sub_admins s WHERE s.id = profiles.referred_by AND s.admin_id = auth.uid())
  );

DROP POLICY IF EXISTS payments_select ON public.payments;
CREATE POLICY payments_select ON public.payments FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR sub_admin_id = auth.uid()
    OR private.is_super_admin()
    OR EXISTS (SELECT 1 FROM public.sub_admins s WHERE s.id = payments.sub_admin_id AND s.admin_id = auth.uid())
  );

-- 5. SIGNUP HELPERS
CREATE OR REPLACE FUNCTION public.username_available(_username text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT NOT EXISTS (SELECT 1 FROM public.sub_admins WHERE username = upper(btrim(_username)))
     AND NOT EXISTS (SELECT 1 FROM public.admins WHERE username = upper(btrim(_username)))
$$;

CREATE OR REPLACE FUNCTION public.validate_admin_code(_code text)
RETURNS TABLE(admin_id uuid, company_name text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id, company_name FROM public.admins
  WHERE username = upper(btrim(_code)) AND is_active AND is_approved
$$;
GRANT EXECUTE ON FUNCTION public.validate_admin_code(text) TO anon, authenticated;

-- 6. SIGNUP TRIGGER WITH ADMIN TIER
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_type text := coalesce(meta->>'account_type','user');
  v_ref text := upper(btrim(coalesce(meta->>'referral_code','')));
  v_admin_code text := upper(btrim(coalesce(meta->>'admin_code','')));
  v_username text := upper(btrim(coalesce(meta->>'username','')));
  v_first boolean;
  v_sub uuid;
  v_admin uuid;
  r record;
begin
  select count(*) = 0 into v_first from public.profiles;

  insert into public.profiles (id, full_name, email, mobile, city, referral_code)
  values (
    new.id,
    coalesce(meta->>'full_name',''),
    coalesce(new.email,''),
    coalesce(meta->>'mobile',''),
    coalesce(meta->>'location', meta->>'city',''),
    case when v_type in ('sub_admin','admin') and v_username <> '' then v_username else null end
  );

  if v_first then
    insert into public.user_roles(user_id, role) values (new.id,'super_admin');
    return new;
  end if;

  if v_type = 'admin' then
    if v_username = '' then raise exception 'Username is required for admin signup'; end if;
    insert into public.admins (id, company_name, username, mobile, whatsapp, email)
    values (new.id, coalesce(meta->>'full_name',''), v_username,
            coalesce(meta->>'mobile',''), coalesce(meta->>'whatsapp',''), coalesce(new.email,''));
    insert into public.user_roles(user_id, role) values (new.id,'admin');
    for r in select ur.user_id from public.user_roles ur where ur.role = 'super_admin' loop
      insert into public.notifications(recipient_id, kind, title, body)
      values (r.user_id, 'new_admin', 'Naya admin request',
              coalesce(meta->>'full_name', new.email) || ' ne admin account banaya hai. Approve karein.');
    end loop;
    return new;
  end if;

  if v_type = 'sub_admin' then
    if v_username = '' then raise exception 'Username is required for subadmin signup'; end if;
    select id into v_admin from public.admins where username = v_admin_code and is_active and is_approved;
    if v_admin is null then raise exception 'Invalid or unapproved admin code'; end if;
    insert into public.sub_admins (id, name, username, mobile, whatsapp, service_type, location, email, facebook_url, instagram_url, admin_id)
    values (
      new.id,
      coalesce(meta->>'full_name',''),
      v_username,
      coalesce(meta->>'mobile',''),
      coalesce(meta->>'whatsapp',''),
      coalesce(meta->>'service_type',''),
      coalesce(meta->>'location',''),
      coalesce(new.email,''),
      coalesce(meta->>'facebook_url',''),
      coalesce(meta->>'instagram_url',''),
      v_admin
    );
    insert into public.user_roles(user_id, role) values (new.id,'sub_admin');
    insert into public.notifications(recipient_id, kind, title, body)
    values (v_admin, 'new_sub_admin', 'Naya subadmin juda',
            coalesce(meta->>'full_name', new.email) || ' aapke admin code se juda hai.');
    return new;
  end if;

  select id into v_sub from public.sub_admins where username = v_ref and is_active;
  if v_sub is null then raise exception 'Invalid or inactive referral code'; end if;

  update public.profiles set referred_by = v_sub where id = new.id;
  insert into public.user_roles(user_id, role) values (new.id,'user');
  insert into public.report_access(user_id) values (new.id);
  insert into public.notifications(recipient_id, kind, title, body)
  values (v_sub, 'new_user', 'Naya user juda',
          coalesce(meta->>'full_name', new.email) || ' aapke referral code se juda hai.');
  return new;
end;
$$;

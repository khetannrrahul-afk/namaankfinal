-- ============ ROLES ============
create type public.app_role as enum ('super_admin','sub_admin','admin','user');

-- ============ PROFILES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  mobile text not null default '',
  city text not null default '',
  referral_code text unique,
  referred_by uuid references public.profiles(id) on delete set null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role in ('super_admin','admin'))
$$;

create or replace function public.is_sub_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = auth.uid() and role = 'sub_admin')
$$;

create or replace function public.my_sub_admin()
returns uuid language sql stable security definer set search_path = public as $$
  select referred_by from public.profiles where id = auth.uid()
$$;

-- ============ SUB ADMINS ============
create table public.sub_admins (
  id uuid primary key references public.profiles(id) on delete cascade,
  name text not null default '',
  username text not null unique,
  mobile text not null default '',
  service_type text not null default '',
  location text not null default '',
  email text not null default '',
  facebook_url text not null default '',
  instagram_url text not null default '',
  telegram_bot_link text not null default '',
  require_facebook boolean not null default true,
  require_instagram boolean not null default true,
  require_share boolean not null default true,
  full_report_price_inr integer not null default 399,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update on public.sub_admins to authenticated;
grant select on public.sub_admins to anon;
grant all on public.sub_admins to service_role;
alter table public.sub_admins enable row level security;

-- ============ SUBMISSIONS ============
create table public.namaank_submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  sub_admin_id uuid references public.sub_admins(id) on delete set null,
  lang text not null default 'hinglish',
  name text not null default '',
  dob text not null default '',
  birth_time text not null default '',
  timezone text not null default '',
  gender text not null default '',
  place text not null default '',
  lat double precision,
  lon double precision,
  mobile text not null default '',
  email text not null default '',
  identity_key text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.namaank_submissions to authenticated;
grant all on public.namaank_submissions to service_role;
alter table public.namaank_submissions enable row level security;

-- ============ REPORT ACCESS ============
create table public.report_access (
  user_id uuid primary key references auth.users(id) on delete cascade,
  short_unlocked boolean not null default false,
  short_unlocked_at timestamptz,
  full_unlocked boolean not null default false,
  full_unlocked_at timestamptz,
  payment_id uuid,
  updated_at timestamptz not null default now()
);
grant select on public.report_access to authenticated;
grant all on public.report_access to service_role;
alter table public.report_access enable row level security;

create table public.social_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  sub_admin_id uuid references public.sub_admins(id) on delete set null,
  action text not null,
  created_at timestamptz not null default now(),
  unique (user_id, action)
);
grant select, insert on public.social_actions to authenticated;
grant all on public.social_actions to service_role;
alter table public.social_actions enable row level security;

-- ============ PAYMENTS ============
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  sub_admin_id uuid references public.sub_admins(id) on delete set null,
  gateway text not null default 'razorpay',
  purpose text not null default 'full_report',
  order_id text,
  payment_id text,
  amount integer not null default 0,
  currency text not null default 'INR',
  status text not null default 'created',
  name text,
  email text,
  mobile text,
  meta jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
grant select on public.payments to authenticated;
grant all on public.payments to service_role;
alter table public.payments enable row level security;

-- ============ NOTIFICATIONS ============
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'info',
  title text not null default '',
  body text not null default '',
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, update on public.notifications to authenticated;
grant all on public.notifications to service_role;
alter table public.notifications enable row level security;

-- ============ SETTINGS ============
create table public.app_settings (
  key text primary key,
  value text not null default '',
  is_public boolean not null default false,
  updated_at timestamptz not null default now()
);
grant select on public.app_settings to authenticated, anon;
grant all on public.app_settings to service_role;
alter table public.app_settings enable row level security;

insert into public.app_settings(key,value,is_public) values
  ('facebook_url','',true),
  ('instagram_url','',true),
  ('youtube_url','',true),
  ('full_report_price_inr','399',true),
  ('min_price_inr','99',true),
  ('max_price_inr','4999',true),
  ('gateway_razorpay_enabled','true',true),
  ('razorpay_key_id','',false),
  ('razorpay_key_secret','',false);

-- ============ MESSAGES + BOTS ============
create table public.messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  delivered_to_telegram boolean not null default false,
  created_at timestamptz not null default now()
);
grant select, insert on public.messages to authenticated;
grant all on public.messages to service_role;
alter table public.messages enable row level security;

create table public.sub_admin_bots (
  sub_admin_id uuid primary key references public.sub_admins(id) on delete cascade,
  bot_token text not null default '',
  sub_admin_chat_id text,
  super_admin_chat_id text,
  is_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);
grant all on public.sub_admin_bots to service_role;
alter table public.sub_admin_bots enable row level security;

-- ============ POLICIES ============
create policy "profiles_select_own" on public.profiles for select to authenticated
  using (id = auth.uid() or referred_by = auth.uid() or public.is_super_admin());
create policy "profiles_update_own" on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_super_admin()) with check (id = auth.uid() or public.is_super_admin());

create policy "user_roles_select" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_super_admin());

create policy "sub_admins_select_public" on public.sub_admins for select to authenticated, anon using (true);
create policy "sub_admins_update_own" on public.sub_admins for update to authenticated
  using (id = auth.uid() or public.is_super_admin()) with check (id = auth.uid() or public.is_super_admin());

create policy "submissions_select" on public.namaank_submissions for select to authenticated
  using (user_id = auth.uid() or sub_admin_id = auth.uid() or public.is_super_admin());
create policy "submissions_insert" on public.namaank_submissions for insert to authenticated
  with check (user_id = auth.uid() or user_id is null);
create policy "submissions_update_admin" on public.namaank_submissions for update to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());
create policy "submissions_delete_admin" on public.namaank_submissions for delete to authenticated
  using (public.is_super_admin());

create policy "report_access_select" on public.report_access for select to authenticated
  using (user_id = auth.uid() or public.is_super_admin()
         or exists (select 1 from public.profiles p where p.id = report_access.user_id and p.referred_by = auth.uid()));

create policy "social_actions_select" on public.social_actions for select to authenticated
  using (user_id = auth.uid() or sub_admin_id = auth.uid() or public.is_super_admin());
create policy "social_actions_insert" on public.social_actions for insert to authenticated
  with check (user_id = auth.uid());

create policy "payments_select" on public.payments for select to authenticated
  using (user_id = auth.uid() or sub_admin_id = auth.uid() or public.is_super_admin());

create policy "notifications_select" on public.notifications for select to authenticated
  using (recipient_id = auth.uid());
create policy "notifications_update" on public.notifications for update to authenticated
  using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

create policy "app_settings_public_read" on public.app_settings for select to authenticated, anon
  using (is_public or public.is_super_admin());

create policy "messages_select" on public.messages for select to authenticated
  using (sender_id = auth.uid() or recipient_id = auth.uid() or public.is_super_admin());
create policy "messages_insert" on public.messages for insert to authenticated
  with check (sender_id = auth.uid());

-- ============ SIGNUP TRIGGER ============
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  v_type text := coalesce(meta->>'account_type','user');
  v_ref text := upper(btrim(coalesce(meta->>'referral_code','')));
  v_username text := upper(btrim(coalesce(meta->>'username','')));
  v_first boolean;
  v_sub uuid;
begin
  select count(*) = 0 into v_first from public.profiles;

  insert into public.profiles (id, full_name, email, mobile, city, referral_code)
  values (
    new.id,
    coalesce(meta->>'full_name',''),
    coalesce(new.email,''),
    coalesce(meta->>'mobile',''),
    coalesce(meta->>'location', meta->>'city',''),
    case when v_type = 'sub_admin' and v_username <> '' then v_username else null end
  );

  if v_first then
    insert into public.user_roles(user_id, role) values (new.id,'super_admin'), (new.id,'admin');
    return new;
  end if;

  if v_type = 'sub_admin' then
    if v_username = '' then
      raise exception 'Username is required for subadmin signup';
    end if;
    insert into public.sub_admins (id, name, username, mobile, service_type, location, email, facebook_url, instagram_url)
    values (
      new.id,
      coalesce(meta->>'full_name',''),
      v_username,
      coalesce(meta->>'mobile',''),
      coalesce(meta->>'service_type',''),
      coalesce(meta->>'location',''),
      coalesce(new.email,''),
      coalesce(meta->>'facebook_url',''),
      coalesce(meta->>'instagram_url','')
    );
    insert into public.user_roles(user_id, role) values (new.id,'sub_admin');
    return new;
  end if;

  -- normal user: referral code mandatory
  select id into v_sub from public.sub_admins where username = v_ref and is_active;
  if v_sub is null then
    raise exception 'Invalid or inactive referral code';
  end if;

  update public.profiles set referred_by = v_sub where id = new.id;
  insert into public.user_roles(user_id, role) values (new.id,'user');
  insert into public.report_access(user_id) values (new.id);
  insert into public.notifications(recipient_id, kind, title, body)
  values (v_sub, 'new_user', 'Naya user juda',
          coalesce(meta->>'full_name', new.email) || ' aapke referral code se juda hai.');
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- referral code validation (public, safe: only returns whether it works)
create or replace function public.validate_referral_code(_code text)
returns table (sub_admin_id uuid, sub_admin_name text)
language sql stable security definer set search_path = public as $$
  select id, name from public.sub_admins where username = upper(btrim(_code)) and is_active
$$;

create or replace function public.username_available(_username text)
returns boolean language sql stable security definer set search_path = public as $$
  select not exists (select 1 from public.sub_admins where username = upper(btrim(_username)))
$$;

grant execute on function public.validate_referral_code(text) to anon, authenticated;
grant execute on function public.username_available(text) to anon, authenticated;
grant execute on function public.is_super_admin() to authenticated;
grant execute on function public.is_sub_admin() to authenticated;
grant execute on function public.my_sub_admin() to authenticated;
grant execute on function public.has_role(uuid, public.app_role) to authenticated;
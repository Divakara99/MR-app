-- PharmaSales Jobs — Supabase Auth + app-data backend
-- Run this once in Supabase Dashboard → SQL Editor.
--
-- Supabase Auth (`auth.users`) is the only login/session authority for Job
-- Seekers, Recruiters and Admin:
-- 1) Registration first creates the Supabase Auth account with full name,
--    mobile number, correct email ID and a password of at least 6
--    characters stored as Auth user metadata for first-login profile
--    creation. Email confirmation remains ON.
-- 2) After confirming email, login accepts registered mobile OR email:
--    the profile lookup resolves mobile to the registered email and
--    Supabase Auth verifies the password. Google uses the same Auth session.
-- 3) Forgot Password uses Supabase's secure email reset link. A pre-Auth
--    profile links automatically when its owner creates the Auth account
--    once with the same registered email/mobile and confirms/logs in.
-- Job Seeker + Recruiter profiles live in public.app_accounts linked by
-- auth_user_id. Admin is an allowlist row in public.app_admins linked to a
-- manually created Supabase Auth user. Purchases/payments remain in
-- public.app_purchases for Admin Users / Purchase / Payment lists.

create schema if not exists extensions;

create or replace function public.is_valid_app_email(p_email text)
returns boolean
language plpgsql
immutable
set search_path = public
as $$
declare
  v_email text := lower(trim(coalesce(p_email, '')));
  v_local text;
  v_domain text;
  v_gmail_username text;
  v_gmail_tag text;
begin
  if char_length(v_email) = 0 or char_length(v_email) > 254 or v_email ~ '[[:space:]]' then
    return false;
  end if;

  if (char_length(v_email) - char_length(replace(v_email, '@', ''))) <> 1 then
    return false;
  end if;

  v_local := split_part(v_email, '@', 1);
  v_domain := split_part(v_email, '@', 2);

  if char_length(v_local) = 0 or char_length(v_local) > 64
     or char_length(v_domain) = 0 or char_length(v_domain) > 253
     or v_domain not like '%.%'
     or v_domain like '.%'
     or v_domain like '%.'
     or v_domain like '%..%' then
    return false;
  end if;

  if exists (
    select 1
    from unnest(string_to_array(v_domain, '.')) as labels(domain_label)
    where char_length(labels.domain_label) = 0
       or char_length(labels.domain_label) > 63
       or labels.domain_label !~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'
  ) then
    return false;
  end if;

  if split_part(v_domain, '.', array_length(string_to_array(v_domain, '.'), 1))
       !~ '^([a-z]{2,}|xn--[a-z0-9-]+)$' then
    return false;
  end if;

  -- Gmail/Googlemail domains must be complete and correctly spelled.
  if (v_domain like 'gmail.%' or v_domain like 'googlemail.%'
      or v_domain in ('gamil.com', 'gmial.com', 'gmaill.com', 'gmai.com', 'gmal.com', 'gmali.com', 'gamil.co', 'gmial.co', 'gmaill.co', 'googlemai.com', 'googlemial.com'))
     and v_domain not in ('gmail.com', 'googlemail.com') then
    return false;
  end if;

  if v_domain in ('gmail.com', 'googlemail.com') then
    if (char_length(v_local) - char_length(replace(v_local, '+', ''))) > 1 or v_local like '%+' then
      return false;
    end if;

    v_gmail_username := split_part(v_local, '+', 1);
    v_gmail_tag := nullif(split_part(v_local, '+', 2), '');

    if v_gmail_tag is not null and v_gmail_tag !~ '^[a-z0-9.]+$' then
      return false;
    end if;

    return v_gmail_username ~ '^[a-z0-9.]{6,30}$'
       and v_gmail_username not like '.%'
       and v_gmail_username not like '%.'
       and v_gmail_username not like '%..%';
  end if;

  return v_local ~ '^[a-z0-9.!#$%&''*+/=?^_`{|}~-]+(\.[a-z0-9.!#$%&''*+/=?^_`{|}~-]+)*$';
end;
$$;

create table if not exists public.app_accounts (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('seeker', 'recruiter')),
  name text not null check (char_length(trim(name)) >= 3),
  mobile text not null check (mobile ~ '^[6-9][0-9]{9}$'),
  email text not null check (public.is_valid_app_email(email)),
  auth_user_id uuid references auth.users(id) on delete set null,
  profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (role, mobile)
);

alter table public.app_accounts
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

create index if not exists app_accounts_mobile_idx on public.app_accounts (mobile);
create index if not exists app_accounts_candidate_idx
  on public.app_accounts (role, updated_at desc);
create index if not exists app_accounts_auth_user_idx
  on public.app_accounts (auth_user_id);
create unique index if not exists app_accounts_auth_role_uidx
  on public.app_accounts (auth_user_id, role)
  where auth_user_id is not null;

-- Login by email must identify one account within the selected role.
create unique index if not exists app_accounts_role_email_uidx
  on public.app_accounts (role, lower(email));

-- Strengthen installations created by an older version of this schema.
-- NOT VALID protects every new/updated row without blocking setup because of
-- a legacy row that still needs its saved email corrected through the app.
alter table public.app_accounts drop constraint if exists app_accounts_email_check;
alter table public.app_accounts
  add constraint app_accounts_email_check
  check (public.is_valid_app_email(email)) not valid;

alter table public.app_accounts enable row level security;

-- Do not expose the private account table directly to browser clients.
revoke all on table public.app_accounts from anon, authenticated;

-- Supabase Auth is the only account/password system. Permanently remove the
-- legacy custom-password RPCs from existing installations. The profile
-- lookup/link RPCs used by the current client are created in the Supabase
-- Auth-only section near the end of this schema.
drop function if exists public.find_app_accounts_by_mobile(text);
drop function if exists public.find_app_accounts_by_identifier(text);
drop function if exists public.register_app_account(text, text, text, text);
drop function if exists public.register_app_account(text, text, text, text, text);
drop function if exists public.login_app_account(text, text, text);
drop function if exists public.set_app_password(text, text, text);
drop function if exists public.reset_app_password_with_registered_details(text, text, text, text);
drop function if exists public.update_app_account_email(text, text, text, text);
drop function if exists public.update_seeker_profile(text, jsonb);
drop function if exists public.delete_app_account(text, text);

-- Recruiter candidate list: returns only anonymous job-profile data.
-- It never returns candidate name, mobile number or email.
create or replace function public.list_anonymous_candidate_profiles()
returns table (
  candidate_id text,
  candidate_code text,
  profile jsonb
)
language sql
stable
security definer
set search_path = public
as $$
  select
    a.id::text as candidate_id,
    'MR-2026-' || (1000 + abs(hashtext(a.id::text) % 9000))::text as candidate_code,
    -- Private upload metadata/photo data must never leave the candidate RPC.
    (a.profile
      - 'profilePhoto'
      - 'resumeName'
      - 'resumeSize'
      - 'resumeType'
      - 'resumeUploadedAt'
      - 'resumeStoragePath') as profile
  from public.app_accounts a
  where a.role = 'seeker'
    and coalesce(a.profile->>'experienceType', '') in ('fresher', 'experienced')
    and coalesce(a.profile->>'desiredRole', '') <> ''
    and coalesce(a.profile->>'qualification', '') <> ''
    and coalesce(a.profile->>'expectedPackage', '') <> ''
    and coalesce(a.profile->>'state', '') <> ''
    and coalesce(a.profile->>'city', '') <> ''
    and coalesce(a.profile->>'currentHq', '') <> ''
    and coalesce(a.profile->>'noticePeriod', '') <> ''
    and coalesce(a.profile->>'twoWheeler', '') <> ''
    and (
      (
        a.profile->>'experienceType' = 'fresher'
        and coalesce(a.profile->>'passingYear', '') ~ '^[0-9]{4}$'
      )
      or
      (
        a.profile->>'experienceType' = 'experienced'
        and coalesce(a.profile->>'totalExperience', '') <> ''
        and coalesce(a.profile->>'currentCompany', '') <> ''
        and coalesce(a.profile->>'currentRole', '') <> ''
        and coalesce(a.profile->>'currentPackage', '') <> ''
      )
    )
  order by a.updated_at desc;
$$;

-- ---------------------------------------------------------------------------
-- Admin-managed data: Purchases/Payments + Admin accounts (all three roles).
-- Job Seeker and Recruiter accounts live in public.app_accounts above.
-- Admin is an allowlist row in public.app_admins linked to a Supabase Auth user.
-- The Admin dashboard reads these through the admin_list_* RPCs below.
-- ---------------------------------------------------------------------------

create table if not exists public.app_purchases (
  id uuid primary key default gen_random_uuid(),
  role text not null default 'seeker' check (role in ('seeker', 'recruiter')),
  name text not null,
  mobile text not null default '',
  email text not null default '',
  plan text not null check (plan in ('starter', 'pro')),
  amount_inr numeric(10, 2) not null check (amount_inr >= 0),
  method text not null default 'In-App',
  status text not null default 'paid' check (status in ('paid', 'pending', 'failed')),
  transaction_id text not null unique,
  purchased_at timestamptz not null default now(),
  expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists app_purchases_mobile_idx on public.app_purchases (mobile);
create index if not exists app_purchases_recent_idx on public.app_purchases (purchased_at desc);

alter table public.app_purchases enable row level security;
revoke all on table public.app_purchases from anon, authenticated;

create table if not exists public.app_admins (
  id uuid primary key default gen_random_uuid(),
  admin_id text not null unique,
  name text not null,
  email text not null default '',
  auth_user_id uuid unique references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

alter table public.app_admins enable row level security;
revoke all on table public.app_admins from anon, authenticated;

alter table public.app_admins
  add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;
alter table public.app_admins
  drop column if exists password_hash;

-- Admin allowlist row only. No Admin password is seeded or stored in this
-- repository. Create the corresponding Supabase Auth user once in
-- Supabase Dashboard -> Authentication -> Users -> Add user for the
-- registered Admin email; the app links it on first successful Admin login.
insert into public.app_admins (admin_id, name, email)
values ('divakar', 'M Divakar Reddy', 'akhildivakara@gmail.com')
on conflict (admin_id) do nothing;

-- Admin account/purchase lists are provided only by the Auth-checked RPCs
-- near the end of this schema.

-- Record one Starter/Pro purchase + payment (called right after checkout).
create or replace function public.record_app_purchase(
  p_role text,
  p_name text,
  p_mobile text,
  p_email text,
  p_plan text,
  p_amount numeric,
  p_method text,
  p_status text,
  p_transaction_id text,
  p_expires_at timestamptz
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := lower(trim(coalesce(p_role, 'seeker')));
  v_mobile text := regexp_replace(coalesce(p_mobile, ''), '[^0-9]', '', 'g');
  v_transaction_id text := trim(coalesce(p_transaction_id, ''));
  v_status text := lower(trim(coalesce(nullif(p_status, ''), 'paid')));
begin
  if length(v_mobile) = 12 and left(v_mobile, 2) = '91' then
    v_mobile := right(v_mobile, 10);
  end if;

  if v_role not in ('seeker', 'recruiter')
     or trim(coalesce(p_name, '')) = ''
     or p_plan not in ('starter', 'pro')
     or p_amount is null
     or p_amount < 0
     or v_status not in ('paid', 'pending', 'failed')
     or v_transaction_id = ''
     or char_length(v_transaction_id) > 160
     or p_expires_at is null then
    return false;
  end if;

  -- A UPI/UTR/payment reference can activate only one purchase.
  if exists (
    select 1
    from public.app_purchases existing_purchase
    where lower(existing_purchase.transaction_id) = lower(v_transaction_id)
  ) then
    return false;
  end if;

  insert into public.app_purchases (role, name, mobile, email, plan, amount_inr, method, status, transaction_id, expires_at)
  values (
    v_role,
    trim(p_name),
    v_mobile,
    coalesce(lower(trim(p_email)), ''),
    p_plan,
    p_amount,
    coalesce(nullif(trim(p_method), ''), 'In-App'),
    v_status,
    v_transaction_id,
    p_expires_at
  );

  return true;
end;
$$;

-- One Job Seeker's synced Starter/Pro purchases, used to restore the active
-- paid plan automatically on every signed-in device and remove it at expiry.
create or replace function public.list_app_purchases_for_mobile(p_mobile text)
returns table (
  id text,
  role text,
  name text,
  mobile text,
  email text,
  plan text,
  amount_inr numeric,
  method text,
  status text,
  transaction_id text,
  purchased_at timestamptz,
  expires_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  with normalized as (
    select case
      when length(regexp_replace(coalesce(p_mobile, ''), '[^0-9]', '', 'g')) = 12
        and left(regexp_replace(coalesce(p_mobile, ''), '[^0-9]', '', 'g'), 2) = '91'
      then right(regexp_replace(coalesce(p_mobile, ''), '[^0-9]', '', 'g'), 10)
      else regexp_replace(coalesce(p_mobile, ''), '[^0-9]', '', 'g')
    end as mobile
  )
  select p.id::text, p.role, p.name, p.mobile, p.email, p.plan, p.amount_inr, p.method, p.status, p.transaction_id, p.purchased_at, p.expires_at
  from public.app_purchases p
  cross join normalized n
  where p.role = 'seeker'
    and p.mobile = n.mobile
  order by p.purchased_at desc;
$$;

-- Permanently remove the legacy public-table Admin password/list RPCs from
-- existing installations. Admin identity and Admin lists use Supabase Auth
-- plus the Auth-checked RPCs near the end of this schema.
drop function if exists public.admin_list_accounts();
drop function if exists public.admin_list_purchases();
drop function if exists public.admin_login(text, text);
drop function if exists public.admin_change_password(text, text, text);
drop function if exists public.admin_reset_password_with_registered_details(text, text, text);
revoke all on function public.record_app_purchase(text, text, text, text, text, numeric, text, text, text, timestamptz) from public;
revoke all on function public.list_app_purchases_for_mobile(text) from public;
grant execute on function public.record_app_purchase(text, text, text, text, text, numeric, text, text, text, timestamptz) to anon, authenticated;
grant execute on function public.list_app_purchases_for_mobile(text) to anon, authenticated;
revoke all on function public.list_anonymous_candidate_profiles() from public;
grant execute on function public.list_anonymous_candidate_profiles() to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Cross-device app collections: live vacancies, pending approvals, support
-- tickets, and Job Seeker account-deletion requests. Records keep the app's
-- JSON payload plus a stable position so list order is preserved across
-- devices. Direct table access stays revoked; the app uses these RPCs.
-- ---------------------------------------------------------------------------

create table if not exists public.app_sync_records (
  collection_key text not null check (collection_key in ('jobs', 'pending_jobs', 'support_tickets', 'deletion_requests')),
  record_id text not null check (char_length(record_id) between 1 and 160),
  record_position integer not null default 0 check (record_position >= 0),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (collection_key, record_id)
);

create index if not exists app_sync_records_collection_position_idx
  on public.app_sync_records (collection_key, record_position, updated_at desc);

alter table public.app_sync_records enable row level security;
revoke all on table public.app_sync_records from public, anon, authenticated;

create or replace function public.list_app_sync_records(p_collection_key text)
returns table (
  record_id text,
  record_position integer,
  payload jsonb,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select r.record_id, r.record_position, r.payload, r.updated_at
  from public.app_sync_records r
  where r.collection_key = p_collection_key
  order by r.record_position asc, r.updated_at desc;
$$;

create or replace function public.upsert_app_sync_record(
  p_collection_key text,
  p_record_id text,
  p_position integer,
  p_payload jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_collection_key not in ('jobs', 'pending_jobs', 'support_tickets', 'deletion_requests')
     or p_record_id is null
     or char_length(trim(p_record_id)) not between 1 and 160
     or p_position is null
     or p_position < 0
     or p_payload is null
     or jsonb_typeof(p_payload) <> 'object'
     or coalesce(p_payload->>'id', '') <> trim(p_record_id)
     or pg_column_size(p_payload) > 262144 then
    return false;
  end if;

  insert into public.app_sync_records (collection_key, record_id, record_position, payload)
  values (p_collection_key, trim(p_record_id), p_position, p_payload)
  on conflict (collection_key, record_id)
  do update set
    record_position = excluded.record_position,
    payload = excluded.payload,
    updated_at = now();

  return true;
end;
$$;

create or replace function public.delete_app_sync_record(
  p_collection_key text,
  p_record_id text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  if p_collection_key not in ('jobs', 'pending_jobs', 'support_tickets', 'deletion_requests')
     or p_record_id is null
     or char_length(trim(p_record_id)) not between 1 and 160 then
    return false;
  end if;

  delete from public.app_sync_records
  where collection_key = p_collection_key
    and record_id = trim(p_record_id);

  get diagnostics deleted_count = row_count;
  return deleted_count > 0;
end;
$$;

revoke all on function public.list_app_sync_records(text) from public;
revoke all on function public.upsert_app_sync_record(text, text, integer, jsonb) from public;
revoke all on function public.delete_app_sync_record(text, text) from public;

grant execute on function public.list_app_sync_records(text) to anon, authenticated;
grant execute on function public.upsert_app_sync_record(text, text, integer, jsonb) to anon, authenticated;
grant execute on function public.delete_app_sync_record(text, text) to anon, authenticated;

-- Per-account Job Seeker/Recruiter activity state: saved jobs, applied jobs,
-- candidate interests, and same-day sponsored/free reveal usage. The composite
-- foreign key removes this state automatically when the account is deleted.
create table if not exists public.app_user_states (
  role text not null check (role in ('seeker', 'recruiter')),
  mobile text not null check (mobile ~ '^[6-9][0-9]{9}$'),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (role, mobile),
  foreign key (role, mobile) references public.app_accounts (role, mobile) on delete cascade
);

alter table public.app_user_states enable row level security;
revoke all on table public.app_user_states from public, anon, authenticated;

create or replace function public.get_app_user_state(
  p_role text,
  p_mobile text
)
returns table (
  payload jsonb,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select s.payload, s.updated_at
  from public.app_user_states s
  where s.role = p_role
    and s.mobile = regexp_replace(coalesce(p_mobile, ''), '[^0-9]', '', 'g');
$$;

create or replace function public.set_app_user_state(
  p_role text,
  p_mobile text,
  p_payload jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_mobile text := regexp_replace(coalesce(p_mobile, ''), '[^0-9]', '', 'g');
begin
  if length(v_mobile) = 12 and left(v_mobile, 2) = '91' then
    v_mobile := right(v_mobile, 10);
  end if;

  if p_role not in ('seeker', 'recruiter')
     or v_mobile !~ '^[6-9][0-9]{9}$'
     or p_payload is null
     or jsonb_typeof(p_payload) <> 'object'
     or pg_column_size(p_payload) > 262144
     or not exists (
       select 1
       from public.app_accounts a
       where a.role = p_role
         and a.mobile = v_mobile
     ) then
    return false;
  end if;

  insert into public.app_user_states (role, mobile, payload)
  values (p_role, v_mobile, p_payload)
  on conflict (role, mobile)
  do update set
    payload = excluded.payload,
    updated_at = now();

  return true;
end;
$$;

revoke all on function public.get_app_user_state(text, text) from public;
revoke all on function public.set_app_user_state(text, text, jsonb) from public;

grant execute on function public.get_app_user_state(text, text) to anon, authenticated;
grant execute on function public.set_app_user_state(text, text, jsonb) to anon, authenticated;

-- Admin-managed app settings. The only current key is `commerce`: Job Seeker
-- Starter/Pro names, prices, validity days, daily limits, benefits and the
-- payment receiving source (receiver, UPI ID/QR, payment link, bank details
-- and checkout instructions). Reads are public because these values are shown
-- at checkout; writes use the linked Supabase Auth Admin RPC defined near
-- the end of this schema.
create table if not exists public.app_settings (
  setting_key text primary key check (setting_key in ('commerce')),
  payload jsonb not null default '{}'::jsonb check (jsonb_typeof(payload) = 'object'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;
revoke all on table public.app_settings from public, anon, authenticated;

create or replace function public.get_app_setting(p_setting_key text)
returns table (
  payload jsonb,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select s.payload, s.updated_at
  from public.app_settings s
  where s.setting_key = lower(trim(coalesce(p_setting_key, '')))
    and s.setting_key in ('commerce');
$$;

drop function if exists public.set_app_setting_admin(text, text, text, jsonb);

revoke all on function public.get_app_setting(text) from public;

grant execute on function public.get_app_setting(text) to anon, authenticated;


-- ---------------------------------------------------------------------------
-- Supabase Auth-only identities (applied live as migration
-- `supabase_auth_profiles_and_admin_link`).
--
-- Authentication/session authority is Supabase Auth (`auth.users`) for Job
-- Seekers, Recruiters and Admin. `public.app_accounts` is now profile/app
-- data linked by `auth_user_id`. Pre-Auth rows are recognized by a null
-- `auth_user_id` and linked when their owner creates a Supabase Auth
-- account once with the same registered email/mobile.
-- `public.app_admins` is an Admin allowlist row linked to the Admin Auth
-- user. Create that Auth user once in Supabase Dashboard -> Authentication
-- -> Users -> Add user for the registered Admin email; the app links it on
-- first successful Admin Auth login.
-- ---------------------------------------------------------------------------

alter table public.app_accounts
  add column if not exists auth_user_id uuid references auth.users(id) on delete set null;

create index if not exists app_accounts_auth_user_idx
  on public.app_accounts (auth_user_id);

create unique index if not exists app_accounts_auth_role_uidx
  on public.app_accounts (auth_user_id, role)
  where auth_user_id is not null;

alter table public.app_admins
  add column if not exists auth_user_id uuid unique references auth.users(id) on delete set null;

alter table public.app_accounts
  drop column if exists password_hash;

alter table public.app_admins
  drop column if exists password_hash;

-- Auth profile RPCs no longer return a password-state field, and the unused
-- resolve RPC is removed. Drop older definitions before recreating the RPCs
-- that the current client calls.
drop function if exists public.resolve_auth_login_profile(text, text);
drop function if exists public.list_auth_profiles_for_current_user();
drop function if exists public.upsert_auth_profile(text, text, text, text);
drop function if exists public.update_auth_profile_name(text, text);
drop function if exists public.update_auth_seeker_profile(jsonb);
drop function if exists public.admin_list_accounts_auth();

create or replace function public.normalize_app_mobile(p_mobile text)
returns text
language sql
immutable
set search_path = public
as $$
  select case
    when length(regexp_replace(coalesce(p_mobile, ''), '[^0-9]', '', 'g')) = 12
      and left(regexp_replace(coalesce(p_mobile, ''), '[^0-9]', '', 'g'), 2) = '91'
    then right(regexp_replace(coalesce(p_mobile, ''), '[^0-9]', '', 'g'), 10)
    when length(regexp_replace(coalesce(p_mobile, ''), '[^0-9]', '', 'g')) = 11
      and left(regexp_replace(coalesce(p_mobile, ''), '[^0-9]', '', 'g'), 1) = '0'
    then right(regexp_replace(coalesce(p_mobile, ''), '[^0-9]', '', 'g'), 10)
    else regexp_replace(coalesce(p_mobile, ''), '[^0-9]', '', 'g')
  end;
$$;

create or replace function public.current_auth_email()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce(
    (select u.email from auth.users u where u.id = auth.uid()),
    auth.jwt() ->> 'email',
    ''
  ));
$$;

drop function if exists public.find_app_accounts_by_mobile(text);
create function public.find_app_accounts_by_mobile(p_mobile text)
returns table (
  role text,
  name text,
  mobile text,
  email text,
  auth_user_id uuid,
  auth_linked boolean,
  profile jsonb,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select a.role, a.name, a.mobile, a.email,
    a.auth_user_id,
    (a.auth_user_id is not null) as auth_linked,
    a.profile, a.created_at
  from public.app_accounts a
  where a.mobile = public.normalize_app_mobile(p_mobile)
  order by a.created_at asc;
$$;

drop function if exists public.find_app_accounts_by_identifier(text);
create function public.find_app_accounts_by_identifier(p_identifier text)
returns table (
  role text,
  name text,
  mobile text,
  email text,
  auth_user_id uuid,
  auth_linked boolean,
  profile jsonb,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public, extensions
as $$
declare
  v_identifier text := trim(coalesce(p_identifier, ''));
begin
  if position('@' in v_identifier) > 0 then
    return query
    select a.role, a.name, a.mobile, a.email,
      a.auth_user_id,
      (a.auth_user_id is not null) as auth_linked,
      a.profile, a.created_at
    from public.app_accounts a
    where lower(a.email) = lower(v_identifier)
    order by a.created_at asc;
    return;
  end if;

  return query
  select a.role, a.name, a.mobile, a.email,
    a.auth_user_id,
    (a.auth_user_id is not null) as auth_linked,
    a.profile, a.created_at
  from public.app_accounts a
  where a.mobile = public.normalize_app_mobile(v_identifier)
  order by a.created_at asc;
end;
$$;

create or replace function public.list_auth_profiles_for_current_user()
returns table (
  role text,
  name text,
  mobile text,
  email text,
  auth_user_id uuid,
  auth_linked boolean,
  profile jsonb,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select a.role, a.name, a.mobile, a.email,
    a.auth_user_id, true as auth_linked, a.profile, a.created_at
  from public.app_accounts a
  where auth.uid() is not null and a.auth_user_id = auth.uid()
  order by a.created_at asc;
$$;

create or replace function public.upsert_auth_profile(
  p_role text,
  p_name text,
  p_mobile text,
  p_email text
)
returns table (
  role text,
  name text,
  mobile text,
  email text,
  auth_user_id uuid,
  auth_linked boolean,
  profile jsonb,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_auth_email text := public.current_auth_email();
  v_role text := lower(trim(coalesce(p_role, '')));
  v_name text := trim(regexp_replace(coalesce(p_name, ''), '[[:space:]]+', ' ', 'g'));
  v_mobile text := public.normalize_app_mobile(p_mobile);
  v_email text := lower(trim(coalesce(p_email, '')));
  v_existing public.app_accounts%rowtype;
begin
  if v_uid is null then
    raise exception 'Please login again to save your account profile.' using errcode = '28000';
  end if;
  if v_role not in ('seeker', 'recruiter') then
    raise exception 'Please select Job Seeker or Recruiter account type.' using errcode = '23514';
  end if;
  if char_length(v_name) < 3 then
    raise exception 'Enter your full name (minimum 3 letters).' using errcode = '23514';
  end if;
  if v_mobile !~ '^[6-9][0-9]{9}$' then
    raise exception 'Enter a correct 10-digit Indian mobile number.' using errcode = '23514';
  end if;
  if not public.is_valid_app_email(v_email) then
    raise exception 'Please enter a correct email ID. Gmail IDs must end with @gmail.com.' using errcode = '23514';
  end if;
  if v_auth_email = '' or v_auth_email <> v_email then
    raise exception 'Email ID must match your Supabase Auth login email.' using errcode = '23514';
  end if;
  if v_role = 'seeker' and exists (
    select 1 from public.app_accounts blocker
    where blocker.role = 'recruiter' and blocker.mobile = v_mobile
  ) then
    raise exception 'This mobile is registered as a Recruiter account. Job Seeker registration is blocked until that Recruiter account is deleted.' using errcode = '23505';
  end if;

  select * into v_existing
  from public.app_accounts acct
  where acct.auth_user_id = v_uid and acct.role = v_role
  limit 1;

  if found then
    if exists (
      select 1 from public.app_accounts other_account
      where other_account.id <> v_existing.id and other_account.role = v_role and other_account.mobile = v_mobile
    ) then
      raise exception 'This mobile number is already registered for this account type.' using errcode = '23505';
    end if;
    if exists (
      select 1 from public.app_accounts other_account
      where other_account.id <> v_existing.id and other_account.role = v_role and lower(other_account.email) = v_email
    ) then
      raise exception 'This email ID is already registered with another mobile number for this account type.' using errcode = '23505';
    end if;
    if v_existing.mobile <> v_mobile and exists (
      select 1 from public.app_user_states state_row
      where state_row.role = v_role and state_row.mobile = v_existing.mobile
    ) then
      raise exception 'This mobile number cannot be changed here because saved account activity is linked to it. Please contact support.' using errcode = '23514';
    end if;

    update public.app_accounts acct
    set name = v_name,
        mobile = v_mobile,
        email = v_email,
        updated_at = now()
    where acct.id = v_existing.id
    returning * into v_existing;

    return query
    select a.role, a.name, a.mobile, a.email, a.auth_user_id, true, a.profile, a.created_at
    from public.app_accounts a where a.id = v_existing.id;
    return;
  end if;

  select * into v_existing
  from public.app_accounts acct
  where acct.role = v_role and acct.mobile = v_mobile
  limit 1;

  if found then
    if v_existing.auth_user_id is null and lower(v_existing.email) = v_email then
      update public.app_accounts acct
      set auth_user_id = v_uid,
          name = v_name,
          email = v_email,
          updated_at = now()
      where acct.id = v_existing.id
      returning * into v_existing;

      return query
      select a.role, a.name, a.mobile, a.email, a.auth_user_id, true, a.profile, a.created_at
      from public.app_accounts a where a.id = v_existing.id;
      return;
    end if;
    if lower(v_existing.email) <> v_email then
      raise exception 'This mobile number is already registered with another email ID for this account type.' using errcode = '23505';
    end if;
    raise exception 'This mobile number is already registered for this account type.' using errcode = '23505';
  end if;

  if exists (
    select 1 from public.app_accounts email_owner
    where email_owner.role = v_role and lower(email_owner.email) = v_email
  ) then
    raise exception 'This email ID is already registered with another mobile number for this account type.' using errcode = '23505';
  end if;

  insert into public.app_accounts (role, name, mobile, email, auth_user_id)
  values (v_role, v_name, v_mobile, v_email, v_uid)
  returning * into v_existing;

  return query
  select a.role, a.name, a.mobile, a.email, a.auth_user_id, true, a.profile, a.created_at
  from public.app_accounts a where a.id = v_existing.id;
end;
$$;

create or replace function public.update_auth_profile_name(
  p_role text,
  p_name text
)
returns table (
  role text,
  name text,
  mobile text,
  email text,
  auth_user_id uuid,
  auth_linked boolean,
  profile jsonb,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := trim(regexp_replace(coalesce(p_name, ''), '[[:space:]]+', ' ', 'g'));
begin
  if auth.uid() is null then
    raise exception 'Please login again to update your account.' using errcode = '28000';
  end if;
  if char_length(v_name) < 3 then
    raise exception 'Enter your full name (minimum 3 letters).' using errcode = '23514';
  end if;
  return query
  update public.app_accounts a
  set name = v_name, updated_at = now()
  where a.role = lower(trim(coalesce(p_role, ''))) and a.auth_user_id = auth.uid()
  returning a.role, a.name, a.mobile, a.email, a.auth_user_id, true, a.profile, a.created_at;
end;
$$;

create or replace function public.update_auth_seeker_profile(p_profile jsonb)
returns table (
  role text,
  name text,
  mobile text,
  email text,
  auth_user_id uuid,
  auth_linked boolean,
  profile jsonb,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  update public.app_accounts a
  set profile = coalesce(p_profile, '{}'::jsonb), updated_at = now()
  where a.role = 'seeker' and auth.uid() is not null and a.auth_user_id = auth.uid()
  returning a.role, a.name, a.mobile, a.email, a.auth_user_id, true, a.profile, a.created_at;
$$;

create or replace function public.delete_auth_profile(p_role text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  if auth.uid() is null then
    return false;
  end if;
  delete from public.app_accounts a
  where a.role = lower(trim(coalesce(p_role, ''))) and a.auth_user_id = auth.uid();
  get diagnostics deleted_count = row_count;
  return deleted_count > 0;
end;
$$;

create or replace function public.is_current_user_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() is not null and exists (
    select 1
    from public.app_admins a
    where a.auth_user_id = auth.uid()
       or (a.auth_user_id is null and lower(a.email) = public.current_auth_email())
  );
$$;

create or replace function public.link_current_admin_auth_user()
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text := public.current_auth_email();
  v_admin public.app_admins%rowtype;
begin
  if v_uid is null or v_email = '' then
    return false;
  end if;

  select * into v_admin from public.app_admins a where a.auth_user_id = v_uid limit 1;
  if found then
    update public.app_admins set last_login_at = now() where id = v_admin.id;
    return true;
  end if;

  select * into v_admin from public.app_admins a where lower(a.email) = v_email limit 1;
  if not found then
    return false;
  end if;
  if v_admin.auth_user_id is not null and v_admin.auth_user_id <> v_uid then
    return false;
  end if;

  update public.app_admins
  set auth_user_id = v_uid, last_login_at = now()
  where id = v_admin.id;
  return true;
end;
$$;

create or replace function public.get_admin_auth_email(p_identifier text)
returns table (email text, auth_linked boolean)
language sql
stable
security definer
set search_path = public
as $$
  select a.email, (a.auth_user_id is not null) as auth_linked
  from public.app_admins a
  where lower(a.admin_id) = lower(trim(coalesce(p_identifier, '')))
     or lower(a.email) = lower(trim(coalesce(p_identifier, '')))
     or (lower(trim(coalesce(p_identifier, ''))) = 'admin' and a.admin_id = 'divakar')
  limit 1;
$$;

drop function if exists public.admin_list_accounts();

create or replace function public.admin_list_accounts_auth()
returns table (
  role text,
  name text,
  mobile text,
  email text,
  auth_user_id uuid,
  auth_linked boolean,
  profile jsonb,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_current_user_admin() then
    return;
  end if;
  return query
  select a.role, a.name, a.mobile, a.email,
    a.auth_user_id,
    (a.auth_user_id is not null) as auth_linked,
    a.profile, a.created_at
  from public.app_accounts a
  order by a.created_at desc;
end;
$$;

create or replace function public.admin_list_purchases_auth()
returns table (
  id text,
  role text,
  name text,
  mobile text,
  email text,
  plan text,
  amount_inr numeric,
  method text,
  status text,
  transaction_id text,
  purchased_at timestamptz,
  expires_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.is_current_user_admin() then
    return;
  end if;
  return query
  select p.id::text, p.role, p.name, p.mobile, p.email, p.plan, p.amount_inr, p.method, p.status, p.transaction_id, p.purchased_at, p.expires_at
  from public.app_purchases p
  order by p.purchased_at desc;
end;
$$;

create or replace function public.admin_delete_app_account_auth(
  p_role text,
  p_mobile text
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  deleted_count integer;
begin
  if not public.is_current_user_admin() then
    return false;
  end if;
  delete from public.app_accounts a
  where a.role = lower(trim(coalesce(p_role, '')))
    and a.mobile = public.normalize_app_mobile(p_mobile);
  get diagnostics deleted_count = row_count;
  return deleted_count > 0;
end;
$$;

create or replace function public.set_app_setting_admin_auth(
  p_setting_key text,
  p_payload jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_setting_key text := lower(trim(coalesce(p_setting_key, '')));
begin
  if not public.is_current_user_admin() then
    return false;
  end if;
  if v_setting_key not in ('commerce')
     or p_payload is null
     or jsonb_typeof(p_payload) <> 'object'
     or octet_length(p_payload::text) > 1048576 then
    return false;
  end if;
  insert into public.app_settings (setting_key, payload)
  values (v_setting_key, p_payload)
  on conflict (setting_key)
  do update set payload = excluded.payload, updated_at = now();
  return true;
end;
$$;

revoke all on function public.normalize_app_mobile(text) from public;
revoke all on function public.current_auth_email() from public;
revoke all on function public.find_app_accounts_by_mobile(text) from public;
revoke all on function public.find_app_accounts_by_identifier(text) from public;
revoke all on function public.list_auth_profiles_for_current_user() from public;
revoke all on function public.upsert_auth_profile(text, text, text, text) from public;
revoke all on function public.update_auth_profile_name(text, text) from public;
revoke all on function public.update_auth_seeker_profile(jsonb) from public;
revoke all on function public.delete_auth_profile(text) from public;
revoke all on function public.is_current_user_admin() from public;
revoke all on function public.link_current_admin_auth_user() from public;
revoke all on function public.get_admin_auth_email(text) from public;
revoke all on function public.admin_list_accounts_auth() from public;
revoke all on function public.admin_list_purchases_auth() from public;
revoke all on function public.admin_delete_app_account_auth(text, text) from public;
revoke all on function public.set_app_setting_admin_auth(text, jsonb) from public;

grant execute on function public.normalize_app_mobile(text) to anon, authenticated;
grant execute on function public.current_auth_email() to authenticated;
grant execute on function public.find_app_accounts_by_mobile(text) to anon, authenticated;
grant execute on function public.find_app_accounts_by_identifier(text) to anon, authenticated;
grant execute on function public.list_auth_profiles_for_current_user() to authenticated;
grant execute on function public.upsert_auth_profile(text, text, text, text) to authenticated;
grant execute on function public.update_auth_profile_name(text, text) to authenticated;
grant execute on function public.update_auth_seeker_profile(jsonb) to authenticated;
grant execute on function public.delete_auth_profile(text) to authenticated;
grant execute on function public.is_current_user_admin() to authenticated;
grant execute on function public.link_current_admin_auth_user() to authenticated;
grant execute on function public.get_admin_auth_email(text) to anon, authenticated;
grant execute on function public.admin_list_accounts_auth() to authenticated;
grant execute on function public.admin_list_purchases_auth() to authenticated;
grant execute on function public.admin_delete_app_account_auth(text, text) to authenticated;
grant execute on function public.set_app_setting_admin_auth(text, jsonb) to authenticated;

-- Legacy custom-password RPC definitions and browser grants are intentionally
-- absent from this schema. The drop statements above remove them from
-- existing installations when this Auth-only schema is applied.

-- IMPORTANT SECURITY NOTE:
-- Supabase Auth is now the login/session authority for Job Seekers,
-- Recruiters and Admin. Direct table access remains revoked and RLS remains
-- enabled. The pre-login find RPCs are intentionally anon-callable
-- only so login can resolve a registered mobile to its Auth email and show
-- role blockers; add rate limiting/abuse monitoring before a large launch.
-- Collection-sync, per-account user-state and purchase-recording RPCs still
-- accept mobile-keyed parameters for app data compatibility and should get a
-- follow-up hardening pass to derive identity from auth.uid() (or move to a
-- protected server-side API) before a large public launch. Manual
-- UPI/bank transaction references are not independently bank-verified.

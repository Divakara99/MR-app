-- PharmaSales Jobs — Supabase account backend
-- Run this once in Supabase Dashboard → SQL Editor.
--
-- Account flow used by the app for Job Seekers and Recruiters:
-- 1) Registration collects full name, mobile number, correct email ID and a
--    password of at least 6 characters. Passwords are stored only as hashes.
-- 2) Login accepts either the registered mobile number OR registered email ID
--    together with the password.
-- 3) Forgot Password requires the registered mobile number and email ID to
--    match the same selected-role account before a new password is set.
-- The app keeps only role + mobile in its local session until the user logs out.
-- All three roles are managed here: Job Seekers + Recruiters in
-- public.app_accounts, Admin in public.app_admins (bcrypt), and every
-- Starter/Pro purchase + payment in public.app_purchases for the Admin
-- Users / Purchase / Payment lists.

create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

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
  password_hash text,
  profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (role, mobile)
);

create index if not exists app_accounts_mobile_idx on public.app_accounts (mobile);
create index if not exists app_accounts_candidate_idx
  on public.app_accounts (role, updated_at desc);

-- Existing installations created before password login get the nullable hash
-- column. Those legacy rows set their first password in the app.
alter table public.app_accounts add column if not exists password_hash text;

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

-- Account RPC return shapes now include has_password (never the password hash),
-- so drop older definitions before recreating them.
drop function if exists public.find_app_accounts_by_mobile(text);
drop function if exists public.find_app_accounts_by_identifier(text);
drop function if exists public.register_app_account(text, text, text, text);
drop function if exists public.register_app_account(text, text, text, text, text);
drop function if exists public.login_app_account(text, text, text);
drop function if exists public.set_app_password(text, text, text);
drop function if exists public.reset_app_password_with_registered_details(text, text, text, text);
drop function if exists public.update_app_account_email(text, text, text, text);
drop function if exists public.update_seeker_profile(text, jsonb);

create or replace function public.find_app_accounts_by_mobile(p_mobile text)
returns table (
  role text,
  name text,
  mobile text,
  email text,
  has_password boolean,
  profile jsonb,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select a.role, a.name, a.mobile, a.email, (a.password_hash is not null) as has_password, a.profile, a.created_at
  from public.app_accounts a
  where a.mobile = p_mobile
  order by a.created_at asc;
$$;

create or replace function public.find_app_accounts_by_identifier(p_identifier text)
returns table (
  role text,
  name text,
  mobile text,
  email text,
  has_password boolean,
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
  v_digits text := regexp_replace(trim(coalesce(p_identifier, '')), '[^0-9]', '', 'g');
  v_mobile text;
begin
  if position('@' in v_identifier) > 0 then
    return query
    select a.role, a.name, a.mobile, a.email, (a.password_hash is not null) as has_password, a.profile, a.created_at
    from public.app_accounts a
    where lower(a.email) = lower(v_identifier)
    order by a.created_at asc;
    return;
  end if;

  v_mobile := case
    when char_length(v_digits) = 12 and left(v_digits, 2) = '91' then substring(v_digits from 3)
    when char_length(v_digits) = 11 and left(v_digits, 1) = '0' then substring(v_digits from 2)
    else v_digits
  end;

  return query
  select a.role, a.name, a.mobile, a.email, (a.password_hash is not null) as has_password, a.profile, a.created_at
  from public.app_accounts a
  where a.mobile = v_mobile
  order by a.created_at asc;
end;
$$;

create or replace function public.register_app_account(
  p_role text,
  p_name text,
  p_mobile text,
  p_email text,
  p_password text
)
returns table (
  role text,
  name text,
  mobile text,
  email text,
  has_password boolean,
  profile jsonb,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, extensions
as $$
#variable_conflict use_column
begin
  if not public.is_valid_app_email(p_email) then
    raise exception 'Please enter a correct email ID. Gmail IDs must end with @gmail.com.'
      using errcode = '23514';
  end if;

  if char_length(coalesce(p_password, '')) < 6 then
    raise exception 'Password must be at least 6 characters.'
      using errcode = '23514';
  end if;

  if exists (
    select 1
    from public.app_accounts a
    where a.role = p_role
      and lower(a.email) = lower(trim(p_email))
      and a.mobile <> p_mobile
  ) then
    raise exception 'This email ID is already registered with another mobile number for this account type.'
      using errcode = '23505';
  end if;

  insert into public.app_accounts (role, name, mobile, email, password_hash)
  values (
    p_role,
    trim(p_name),
    p_mobile,
    lower(trim(p_email)),
    crypt(p_password, gen_salt('bf', 12))
  )
  on conflict (role, mobile) do nothing;

  return query
  select a.role, a.name, a.mobile, a.email, (a.password_hash is not null) as has_password, a.profile, a.created_at
  from public.app_accounts a
  where a.role = p_role and a.mobile = p_mobile;
end;
$$;

create or replace function public.login_app_account(
  p_role text,
  p_identifier text,
  p_password text
)
returns table (
  role text,
  name text,
  mobile text,
  email text,
  has_password boolean,
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
  v_digits text := regexp_replace(trim(coalesce(p_identifier, '')), '[^0-9]', '', 'g');
  v_mobile text;
begin
  if char_length(coalesce(p_password, '')) < 6 then
    return;
  end if;

  if position('@' in v_identifier) > 0 then
    return query
    select a.role, a.name, a.mobile, a.email, true as has_password, a.profile, a.created_at
    from public.app_accounts a
    where a.role = p_role
      and lower(a.email) = lower(v_identifier)
      and a.password_hash is not null
      and a.password_hash = crypt(p_password, a.password_hash)
    order by a.created_at asc
    limit 1;
    return;
  end if;

  v_mobile := case
    when char_length(v_digits) = 12 and left(v_digits, 2) = '91' then substring(v_digits from 3)
    when char_length(v_digits) = 11 and left(v_digits, 1) = '0' then substring(v_digits from 2)
    else v_digits
  end;

  return query
  select a.role, a.name, a.mobile, a.email, true as has_password, a.profile, a.created_at
  from public.app_accounts a
  where a.role = p_role
    and a.mobile = v_mobile
    and a.password_hash is not null
    and a.password_hash = crypt(p_password, a.password_hash)
  limit 1;
end;
$$;

create or replace function public.set_app_password(
  p_role text,
  p_mobile text,
  p_password text
)
returns table (
  role text,
  name text,
  mobile text,
  email text,
  has_password boolean,
  profile jsonb,
  created_at timestamptz
)
language sql
security definer
set search_path = public, extensions
as $$
  update public.app_accounts a
  set password_hash = crypt(p_password, gen_salt('bf', 12)),
      updated_at = now()
  where a.role = p_role
    and a.mobile = p_mobile
    and a.password_hash is null
    and char_length(coalesce(p_password, '')) >= 6
  returning a.role, a.name, a.mobile, a.email, (a.password_hash is not null) as has_password, a.profile, a.created_at;
$$;

create or replace function public.reset_app_password_with_registered_details(
  p_role text,
  p_mobile text,
  p_email text,
  p_password text
)
returns table (
  role text,
  name text,
  mobile text,
  email text,
  has_password boolean,
  profile jsonb,
  created_at timestamptz
)
language sql
security definer
set search_path = public, extensions
as $$
  update public.app_accounts a
  set password_hash = crypt(p_password, gen_salt('bf', 12)),
      updated_at = now()
  where a.role = p_role
    and a.mobile = p_mobile
    and lower(a.email) = lower(trim(p_email))
    and char_length(coalesce(p_password, '')) >= 6
  returning a.role, a.name, a.mobile, a.email, (a.password_hash is not null) as has_password, a.profile, a.created_at;
$$;

create or replace function public.update_app_account_email(
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
  has_password boolean,
  profile jsonb,
  created_at timestamptz
)
language sql
security definer
set search_path = public, extensions
as $$
  update public.app_accounts a
  set name = trim(p_name),
      email = lower(trim(p_email)),
      updated_at = now()
  where a.role = p_role
    and a.mobile = p_mobile
    and public.is_valid_app_email(p_email)
    and not exists (
      select 1
      from public.app_accounts other_account
      where other_account.role = p_role
        and other_account.mobile <> p_mobile
        and lower(other_account.email) = lower(trim(p_email))
    )
  returning a.role, a.name, a.mobile, a.email, (a.password_hash is not null) as has_password, a.profile, a.created_at;
$$;

create or replace function public.update_seeker_profile(
  p_mobile text,
  p_profile jsonb
)
returns table (
  role text,
  name text,
  mobile text,
  email text,
  has_password boolean,
  profile jsonb,
  created_at timestamptz
)
language sql
security definer
set search_path = public, extensions
as $$
  update public.app_accounts a
  set profile = p_profile,
      updated_at = now()
  where a.role = 'seeker' and a.mobile = p_mobile
  returning a.role, a.name, a.mobile, a.email, (a.password_hash is not null) as has_password, a.profile, a.created_at;
$$;

create or replace function public.delete_app_account(
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
  delete from public.app_accounts a
  where a.role = p_role and a.mobile = p_mobile;

  get diagnostics deleted_count = row_count;
  return deleted_count > 0;
end;
$$;

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
    a.profile
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
-- Admin accounts live in public.app_admins with bcrypt-hashed passwords.
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
  password_hash text not null,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);

alter table public.app_admins enable row level security;
revoke all on table public.app_admins from anon, authenticated;

-- Default Admin account. Change this password after first login
-- (Admin Dashboard → Settings), which updates the bcrypt hash here too.
insert into public.app_admins (admin_id, name, email, password_hash)
values ('divakar', 'M Divakar Reddy', 'akhildivakara@gmail.com', extensions.crypt('Divakar@2026', extensions.gen_salt('bf', 12)))
on conflict (admin_id) do nothing;

-- Admin Users List: every Job Seeker + Recruiter account (never returns hashes).
create or replace function public.admin_list_accounts()
returns table (
  role text,
  name text,
  mobile text,
  email text,
  has_password boolean,
  profile jsonb,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select a.role, a.name, a.mobile, a.email, (a.password_hash is not null) as has_password, a.profile, a.created_at
  from public.app_accounts a
  order by a.created_at desc;
$$;

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
begin
  insert into public.app_purchases (role, name, mobile, email, plan, amount_inr, method, status, transaction_id, expires_at)
  values (
    coalesce(nullif(trim(p_role), ''), 'seeker'),
    trim(p_name),
    coalesce(p_mobile, ''),
    coalesce(lower(trim(p_email)), ''),
    p_plan,
    p_amount,
    coalesce(nullif(trim(p_method), ''), 'In-App'),
    coalesce(nullif(trim(p_status), ''), 'paid'),
    p_transaction_id,
    p_expires_at
  )
  on conflict (transaction_id) do nothing;
  return true;
end;
$$;

-- Admin Purchase List + Payment List (same rows, newest first).
create or replace function public.admin_list_purchases()
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
  select p.id::text, p.role, p.name, p.mobile, p.email, p.plan, p.amount_inr, p.method, p.status, p.transaction_id, p.purchased_at, p.expires_at
  from public.app_purchases p
  order by p.purchased_at desc;
$$;

-- Admin login verified against public.app_admins (bcrypt). Accepts the
-- Admin ID, the word "admin" for the default account, or the admin email.
create or replace function public.admin_login(
  p_admin_id text,
  p_password text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_admin public.app_admins%rowtype;
  v_id text := lower(trim(coalesce(p_admin_id, '')));
begin
  select * into v_admin
  from public.app_admins a
  where lower(a.admin_id) = v_id
     or lower(a.email) = v_id
     or (v_id = 'admin' and a.admin_id = 'divakar')
  limit 1;

  if not found then
    return false;
  end if;

  if v_admin.password_hash = crypt(coalesce(p_password, ''), v_admin.password_hash) then
    update public.app_admins set last_login_at = now() where id = v_admin.id;
    return true;
  end if;

  return false;
end;
$$;

create or replace function public.admin_change_password(
  p_admin_id text,
  p_current_password text,
  p_new_password text
)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_admin public.app_admins%rowtype;
  v_id text := lower(trim(coalesce(p_admin_id, '')));
begin
  if char_length(coalesce(p_new_password, '')) < 6 then
    raise exception 'New password must be at least 6 characters.' using errcode = '23514';
  end if;

  select * into v_admin
  from public.app_admins a
  where lower(a.admin_id) = v_id
     or lower(a.email) = v_id
     or (v_id in ('admin', '') and a.admin_id = 'divakar')
  limit 1;

  if not found then
    return false;
  end if;

  if v_admin.password_hash <> crypt(coalesce(p_current_password, ''), v_admin.password_hash) then
    return false;
  end if;

  update public.app_admins
  set password_hash = crypt(p_new_password, gen_salt('bf', 12))
  where id = v_admin.id;

  return true;
end;
$$;

revoke all on function public.admin_list_accounts() from public;
revoke all on function public.record_app_purchase(text, text, text, text, text, numeric, text, text, text, timestamptz) from public;
revoke all on function public.admin_list_purchases() from public;
revoke all on function public.admin_login(text, text) from public;
revoke all on function public.admin_change_password(text, text, text) from public;

grant execute on function public.admin_list_accounts() to anon, authenticated;
grant execute on function public.record_app_purchase(text, text, text, text, text, numeric, text, text, text, timestamptz) to anon, authenticated;
grant execute on function public.admin_list_purchases() to anon, authenticated;
grant execute on function public.admin_login(text, text) to anon, authenticated;
grant execute on function public.admin_change_password(text, text, text) to anon, authenticated;

revoke all on function public.find_app_accounts_by_mobile(text) from public;
revoke all on function public.find_app_accounts_by_identifier(text) from public;
revoke all on function public.register_app_account(text, text, text, text, text) from public;
revoke all on function public.login_app_account(text, text, text) from public;
revoke all on function public.set_app_password(text, text, text) from public;
revoke all on function public.reset_app_password_with_registered_details(text, text, text, text) from public;
revoke all on function public.update_app_account_email(text, text, text, text) from public;
revoke all on function public.update_seeker_profile(text, jsonb) from public;
revoke all on function public.delete_app_account(text, text) from public;
revoke all on function public.list_anonymous_candidate_profiles() from public;

grant execute on function public.find_app_accounts_by_mobile(text) to anon, authenticated;
grant execute on function public.find_app_accounts_by_identifier(text) to anon, authenticated;
grant execute on function public.register_app_account(text, text, text, text, text) to anon, authenticated;
grant execute on function public.login_app_account(text, text, text) to anon, authenticated;
grant execute on function public.set_app_password(text, text, text) to anon, authenticated;
grant execute on function public.reset_app_password_with_registered_details(text, text, text, text) to anon, authenticated;
grant execute on function public.update_app_account_email(text, text, text, text) to anon, authenticated;
grant execute on function public.update_seeker_profile(text, jsonb) to anon, authenticated;
grant execute on function public.delete_app_account(text, text) to anon, authenticated;
grant execute on function public.list_anonymous_candidate_profiles() to anon, authenticated;

-- IMPORTANT SECURITY NOTE:
-- This schema implements the requested custom mobile/email + password flow and
-- stores passwords only as bcrypt hashes. Forgot Password currently requires
-- both registered identifiers to match because no email/OTP delivery service is
-- connected yet. Before a large public launch, migrate login/recovery to
-- Supabase Auth (or another verified OTP/email-link flow), add rate limiting,
-- and restrict account-lookup responses further. The admin_list_* RPCs return
-- every account/purchase to anon callers who know the function names (same
-- front-end Admin-lock model as the app today) — before a large public launch,
-- move Admin data behind an authenticated admin role or a service-role API.

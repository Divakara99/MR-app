-- MR Vacancies Hub — Supabase account backend
-- Run this once in Supabase Dashboard → SQL Editor.
--
-- Account flow used by the app:
-- 1) Enter mobile number.
-- 2) If an account exists for that mobile/role, open the account directly.
-- 3) If it does not exist, collect name + email and create it.
-- The app keeps only role + mobile in its local session until the user logs out.

create extension if not exists pgcrypto;

create table if not exists public.app_accounts (
  id uuid primary key default gen_random_uuid(),
  role text not null check (role in ('seeker', 'recruiter')),
  name text not null check (char_length(trim(name)) >= 3),
  mobile text not null check (mobile ~ '^[6-9][0-9]{9}$'),
  email text not null check (position('@' in email) > 1),
  profile jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (role, mobile)
);

create index if not exists app_accounts_mobile_idx on public.app_accounts (mobile);
create index if not exists app_accounts_candidate_idx
  on public.app_accounts (role, updated_at desc);

alter table public.app_accounts enable row level security;

-- Do not expose the private account table directly to browser clients.
revoke all on table public.app_accounts from anon, authenticated;

create or replace function public.find_app_accounts_by_mobile(p_mobile text)
returns table (
  role text,
  name text,
  mobile text,
  email text,
  profile jsonb,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select a.role, a.name, a.mobile, a.email, a.profile, a.created_at
  from public.app_accounts a
  where a.mobile = p_mobile
  order by a.created_at asc;
$$;

create or replace function public.register_app_account(
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
  profile jsonb,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.app_accounts (role, name, mobile, email)
  values (p_role, trim(p_name), p_mobile, lower(trim(p_email)))
  on conflict (role, mobile) do nothing;

  return query
  select a.role, a.name, a.mobile, a.email, a.profile, a.created_at
  from public.app_accounts a
  where a.role = p_role and a.mobile = p_mobile;
end;
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
  profile jsonb,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  update public.app_accounts a
  set profile = p_profile,
      updated_at = now()
  where a.role = 'seeker' and a.mobile = p_mobile
  returning a.role, a.name, a.mobile, a.email, a.profile, a.created_at;
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

revoke all on function public.find_app_accounts_by_mobile(text) from public;
revoke all on function public.register_app_account(text, text, text, text) from public;
revoke all on function public.update_seeker_profile(text, jsonb) from public;
revoke all on function public.delete_app_account(text, text) from public;
revoke all on function public.list_anonymous_candidate_profiles() from public;

grant execute on function public.find_app_accounts_by_mobile(text) to anon, authenticated;
grant execute on function public.register_app_account(text, text, text, text) to anon, authenticated;
grant execute on function public.update_seeker_profile(text, jsonb) to anon, authenticated;
grant execute on function public.delete_app_account(text, text) to anon, authenticated;
grant execute on function public.list_anonymous_candidate_profiles() to anon, authenticated;

-- IMPORTANT SECURITY NOTE:
-- The requested mobile-only login has no password/OTP. Before a large public
-- launch, protect account lookup with Supabase Phone OTP or another verified
-- login step so a person cannot access an account only by knowing its number.

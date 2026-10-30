# PharmaSales Jobs — Supabase activation checklist

This directory contains the database setup for **PharmaSales Jobs**. The app
is already coded to use Supabase for all three account roles:

- **Job Seeker** accounts in `public.app_accounts`
- **Recruiter** accounts in `public.app_accounts`
- **Admin** accounts in `public.app_admins`
- **Starter/Pro purchases and payments** in `public.app_purchases`

**Status (30 Oct 2026):** Dedicated project created —
`https://zrkkjgxgykpnzeginbpq.supabase.co` — and the preview app is built
with its URL + publishable key. One step remains: run `schema.sql` once in
that project's SQL Editor (step 2 below), or reconnect the Arena Supabase
integration with the new account so the schema can be executed and verified
from here. Until then, remote calls safely fall back to this device's local
data. Do not add this schema to an unrelated app's Supabase database.

## What to send when the new account/project is ready

Send only these two public frontend values:

```text
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
```

Older Supabase projects may show a legacy **anon public** key instead. In
that case, send it as:

```text
VITE_SUPABASE_ANON_KEY=YOUR_ANON_PUBLIC_KEY
```

Use only **one** of the public-key variables. Find both values in
**Supabase Dashboard → Project Settings → API**.

> **Never send or commit** the `service_role` key, a secret key, the database
> password, or your Supabase account password. The frontend must use only a
> publishable/anon public key.

## Activation sequence

### 1. Create a dedicated Supabase project

Create a new project dedicated only to PharmaSales Jobs. Wait until the
project status is healthy/active before continuing.

### 2. Run the database schema

In the new project:

1. Open **SQL Editor**.
2. Create a new query.
3. Paste the complete contents of [`schema.sql`](./schema.sql).
4. Run the full script once and confirm it finishes without errors.

The script creates:

- `public.app_accounts` — Job Seeker and Recruiter accounts/profiles
- `public.app_purchases` — purchase and payment records
- `public.app_admins` — Admin accounts with bcrypt password hashes
- Account registration, login, password, profile, deletion, candidate,
  purchase, and Admin-list RPC functions
- Row Level Security and restricted direct table access
- The initial Admin account for **M Divakar Reddy** (`divakar`)

Change the seeded Admin password immediately after the first successful
Admin login from **Admin Dashboard → Settings**.

> The URL and public key alone cannot create database tables. Either run
> `schema.sql` in the new project first, or connect that new Supabase
> account through Arena so the schema can be executed and verified.

### 3. Configure the application environment

For local development or this preview, copy the repository template:

```bash
cp .env.example .env.local
```

Then edit `.env.local` and set the project URL plus exactly one public key.
`.env.local` is Git-ignored and must not be committed.

For production, add the same `VITE_SUPABASE_URL` and one public-key
variable in the hosting provider's environment-variable settings.

Vite embeds these values when the frontend is built, so **rebuild and
restart/redeploy** after adding or changing them.

### 4. Verify the connection

After rebuilding:

1. Open the Admin Dashboard and use the sliding **Admin Menu**.
2. Open **Users List**, **Purchase List**, and **Payment List**. Their status
   should change from **This Device** to **Supabase Live** after data loads.
3. Register one test Job Seeker and one test Recruiter.
4. Confirm both test accounts appear in **Users List** from another browser
   or after clearing the first browser's local data.
5. Complete the test Job Seeker profile and confirm the anonymous profile
   can appear to a Recruiter without the candidate's name, mobile, or email.
6. Select a Starter or Pro plan with the test Job Seeker and confirm the
   record appears in both **Purchase List** and **Payment List**.
7. Confirm Admin login still works, then change the seeded Admin password.

Use clearly named test accounts and delete test data before production use.

## What this schema covers now

When both environment variables are present at build time, the app uses
Supabase for:

- Job Seeker and Recruiter registration
- Login by registered mobile **or** registered email
- Password setting/reset flows implemented by the app
- Job Seeker profile storage and updates
- Anonymous Recruiter candidate profiles
- Supported remote account-deletion calls
- Starter/Pro purchase/payment recording
- Admin Users, Purchases, and Payments lists
- Admin login and Admin password changes, with the existing local fallback
  if the remote Admin RPC is unavailable

If the environment variables are absent, the app remains usable with its
existing **This Device** local-storage fallback.

## Not migrated by this schema yet

The following remain outside this schema and require a later migration if
full cross-device backend coverage is required:

- Vacancies and pending-vacancy approvals
- Support tickets and account-deletion requests
- Applications and saved jobs
- Resume file binary storage (currently IndexedDB on the device)
- Production Google Play Billing receipt verification

Current purchase records are generated by the preview's demo in-app
checkout. They are not proof of a real gateway or Google Play payment.

## Production security review required

This setup is ready for controlled testing, but it should receive a security
hardening pass before a large public launch:

- The current RPC design follows the app's custom account flow and grants
  function execution to `anon`/`authenticated`; Admin list RPCs must
  eventually move behind Supabase Auth with an authenticated Admin
  claim/role or a protected server-side API.
- Forgot Password currently verifies registered mobile + email because no
  verified email-link or OTP delivery service is connected.
- Add rate limiting and abuse monitoring for account lookup/login flows.
- Replace demo payment recording with verified gateway/Google Play Billing
  receipts.
- Never expose the `service_role` key in the browser application.

## Quick troubleshooting

- **Admin lists still say “This Device”**: the URL/public key were missing
  at build time, or the app was not rebuilt and restarted/redeployed.
- **Supabase is configured but account actions fail**: confirm the complete
  `schema.sql` ran successfully in the same project as the URL/key.
- **Only one device shows new accounts**: check that production and preview
  are using the same `VITE_SUPABASE_URL` and project public key.
- **Wrong key type**: use publishable or legacy anon public only; never use
  `service_role` in a `VITE_` variable.

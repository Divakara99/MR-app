# PharmaSales Jobs — Supabase activation checklist

This directory contains the database setup for **PharmaSales Jobs**. The app
uses **Supabase Auth only** for login identities/sessions, with Supabase
tables for linked profile and application data:

- **Login identities** for Job Seekers, Recruiters and Admin in
  Supabase **Authentication → Users** (`auth.users`)
- **Job Seeker / Recruiter profiles** in `public.app_accounts`, linked to
  the Auth user by `auth_user_id`
- **Admin allowlist** in `public.app_admins`, linked to the manually created
  Admin Auth user by `auth_user_id`
- **Starter/Pro purchases and payments** in `public.app_purchases`
- **Live vacancies, pending approvals, support tickets, and deletion
  requests** in `public.app_sync_records`
- **Saved/applied jobs, candidate interests, and daily reveal state** in
  `public.app_user_states`
- **Admin-set Job Seeker plan prices/validity/benefits and the payment
  receiving source** in `public.app_settings` (`commerce`)

**Status: LIVE (updated 31 Oct 2026).** Dedicated project **“Pharma sales jobs”**
(`https://zrkkjgxgykpnzeginbpq.supabase.co`, eu-west-3). This schema was
executed there via migrations `pharmasales_jobs_initial_schema`,
`fix_register_variable_conflict`, `admin_forgot_password_rpc`,
`cross_device_app_sync_and_candidate_privacy_v2`,
`per_account_user_job_state_sync`, and
`admin_plans_payments_and_auto_plan_sync`, then verified end-to-end: Job
Seeker and Recruiter registration/login (mobile + email), Admin login by ID
and registered email, Admin Forgot Password reset with registered details,
purchase recording, Admin Users/Purchase/Payment lists through the public
API, cross-device record create/list/delete, per-account saved/applied state
create/read, cascade cleanup when the temporary test account was deleted,
and test-data cleanup. The commerce-settings RPC rejects a wrong Admin
password, a Job Seeker's purchases can be listed by mobile for automatic
plan restoration/expiry, and duplicate payment references are rejected. The
anonymous candidate RPC now strips profile-photo and resume-upload fields
in the database response as well as in the UI.

**Supabase Auth-only update (31 Oct 2026).** Migration
`supabase_auth_profiles_and_admin_link` added `auth_user_id` links plus
Auth profile/Admin RPCs (`find_app_accounts_by_mobile`,
`find_app_accounts_by_identifier`,
`list_auth_profiles_for_current_user`, `upsert_auth_profile`,
`update_auth_profile_name`, `update_auth_seeker_profile`,
`delete_auth_profile`, `link_current_admin_auth_user`,
`admin_list_accounts_auth`, `admin_list_purchases_auth`,
`admin_delete_app_account_auth`, and `set_app_setting_admin_auth`).
Registration now **first creates the Supabase Auth account**; email
confirmation remains **ON**, so the user confirms email and then logs in
with registered mobile **or** email + password (mobile resolves to the
registered email before Supabase Auth verifies the password). Existing
pre-Auth `app_accounts` profiles link automatically when their owner
creates the Auth account once with the same registered email/mobile and
confirms/logs in. Supabase Auth **Site URL** is
`https://mrnew.netlify.app`; redirect allow-list includes production,
Netlify deploy previews, `https://3000-*.e2b.app/**`, and localhost.
**Required one-time owner step for Admin on the new build:** create the
registered Admin email once in **Supabase Dashboard → Authentication →
Users → Add user** (confirmed user, strong password chosen there). The app
links `app_admins.auth_user_id` on first successful Admin Auth login. Never
share or store that Admin password in chat/GitHub. Legacy custom-password
RPC definitions, browser grants, and public-table password columns have
been removed from the repository schema. They remain live temporarily only
because the old production client is still deployed until this update
merges; after production verification, apply the cleaned schema drop
statements to remove them permanently from the live database.
The preview reads the URL + publishable key from `.env.local`
(Git-ignored); production hosting must set the same `VITE_` variables. The
owner changed the live Admin password from the seeded bootstrap value;
never store the live Admin password in this repository. Do not add this
schema to an unrelated app's Supabase database.

**Google login is enabled (verified 30 Oct 2026).** The Supabase Google
provider has the owner's Google OAuth Client ID/Secret configured, and the
public authorize endpoint successfully reaches Google's sign-in page using
the Supabase callback, `email` + `profile` scopes, and the current preview
return URL. Google login is only for Job Seeker/Recruiter accounts; Admin
does not use it. A full account-by-account sign-in test still requires the
user to choose/sign in to their own Google account in the browser.

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

- `public.app_accounts` — Job Seeker and Recruiter profiles linked to
  Supabase Auth users by `auth_user_id`
- `public.app_purchases` — purchase and payment records
- `public.app_admins` — Admin allowlist linked to the manually created
  Supabase Auth Admin user (no seeded Admin password)
- `public.app_sync_records` — ordered cross-device vacancy/support records
- `public.app_user_states` — per-account saved/applied/reveal state
- `public.app_settings` — Admin-managed `commerce` plan/payment settings
- Auth profile lookup/link, profile, deletion, candidate, purchase,
  Admin-list, collection-sync, user-state, and commerce-settings RPC
  functions. When applied to an older installation, the schema also drops
  the legacy custom-password RPCs and public-table password columns.
- Row Level Security and restricted direct table access
- The initial Admin allowlist row for **M Divakar Reddy** (`divakar`)

Before first Admin login on the Auth-only build, create the registered
Admin email once in **Supabase Dashboard → Authentication → Users → Add
user** and set its password there. Later password changes use **Admin
Dashboard → Settings** (current Auth password required).

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

### Google login for Job Seeker / Recruiter (enabled)

Google is a real Supabase Auth session. After Google verifies the email,
the app loads/creates the selected Job Seeker or Recruiter profile linked
to that Auth user. First-time Google users add a mobile number and set a
password once, preserving later mobile/email + password login. Admin does
not use Google; Admin uses separate email/password Supabase Auth login.

The project owner completed this one-time setup directly in Google Cloud
and Supabase on 30 Oct 2026. The configuration below is retained for future
domain changes and troubleshooting. **Never paste the Google Client Secret
into chat, GitHub, or a `VITE_` variable.**

1. In **Google Cloud Console → APIs & Services → Credentials**, create an
   **OAuth client ID** of type **Web application** (configure the OAuth
   consent screen if Google asks).
2. Add this **Authorized redirect URI** exactly:

   ```text
   https://zrkkjgxgykpnzeginbpq.supabase.co/auth/v1/callback
   ```

3. Add the current app origins under **Authorized JavaScript origins** (add
   the final production domain later, before launch):

   ```text
   https://mrnew.netlify.app
   http://localhost:3000
   ```

   Add each exact Netlify deploy-preview or e2b preview origin separately
   when testing Google there (Google does not accept wildcard origins).

4. In **Supabase Dashboard → Authentication → Providers → Google**, enable
   Google and paste the Google **Client ID** and **Client Secret** there.
5. In **Supabase Dashboard → Authentication → URL Configuration**, keep the
   Site URL as `https://mrnew.netlify.app` and the redirect allow-list with
   production, Netlify deploy-preview pattern, e2b preview pattern, and
   localhost. The code returns to the current app origin after Google, email
   confirmation, and password-recovery links.
6. Test both roles: an email with a linked selected-role profile should log
   in directly; a new Google email should ask for mobile number + password
   once to complete/link that role profile.

### 4. Verify the connection

After rebuilding:

1. Open the Admin Dashboard and use the sliding **Admin Menu**.
2. Open **Users List**, **Purchase List**, and **Payment List**. Their status
   should change from **This Device** to **Supabase Live** after data loads.
3. Open **Plan Settings** and **Payment Settings** as separate Admin Menu
   pages. In **Plan Settings**, set each paid plan's name, price, validity
   days, daily direct-contact limit, benefits and purchase on/off state. In
   **Payment Settings**, add the receiver name and enable the real receiving
   source Admin wants shown at checkout (UPI ID/QR, payment link and/or bank
   details). Save each settings change while signed in with the Admin Auth session (no separate password entry).
   Job Seekers also have separate menu pages: **Plans & Benefits** explains
   and compares the cards, while **Payment & My Plan** shows the current
   plan, five payment steps, ready payment methods and payment history.
4. Register one test Job Seeker and one test Recruiter. Confirm each email, then login with mobile/email + password and confirm the accounts appear in **Authentication → Users** plus linked rows in `app_accounts`.
5. Confirm both test accounts appear in **Users List** from another browser
   or after clearing the first browser's local data. Use **View Account** to
   review each account/profile and current plan; passwords are not displayed.
6. Complete the test Job Seeker profile and confirm the anonymous profile
   can appear to a Recruiter without the candidate's name, mobile, or email.
7. Select a Starter or Pro plan from **Plans & Benefits** with the test Job
   Seeker. Confirm checkout's step cards show the Admin-set
   amount/validity/receiving source and UTR entry, completion records the
   method and transaction/UTR reference in both **Purchase List** and
   **Payment List**, and the account becomes paid immediately. Confirm the
   new purchase and active-plan expiry appear on **Payment & My Plan**, the
   same active plan restores on another device, and it returns to Free when
   its `expires_at` time passes.
8. Post/approve a test vacancy, raise a test support ticket, and save/apply
   to a test job; confirm the same records/state appear after signing in on
   another browser or device.
9. Create the Admin Auth user once in Supabase Dashboard, confirm Admin login works with Admin ID/email + that Auth password, then test Admin password change in Settings.

Use clearly named test accounts and delete test data before production use.

## What this schema covers now

When both environment variables are present at build time, the app uses
Supabase for:

- Job Seeker and Recruiter registration in Supabase Auth + linked profiles
- Google Supabase Auth login for Job Seekers/Recruiters
- Login by registered mobile **or** registered email, verified by Supabase
  Auth passwords/sessions
- Email confirmation and secure email-link password reset
- Job Seeker profile storage and updates
- Anonymous Recruiter candidate profiles
- Supported remote account-deletion calls
- Starter/Pro purchase/payment recording
- Admin-managed Starter/Pro prices, validity, daily limits, benefits and
  payment receiving source, with per-Job-Seeker purchase lookup for automatic
  paid-plan activation/expiry across devices
- Live vacancies and pending-vacancy Admin approvals
- Support tickets and Job Seeker account-deletion requests
- Saved jobs, applied jobs, Recruiter candidate interests, and same-day
  free/sponsored reveal usage for the signed-in account
- Admin Users, Purchases, and Payments lists
- Admin Supabase Auth login, Admin password changes, and email-link Admin
  password reset (Admin Auth user must be created once in the Dashboard)

If the environment variables are absent, public/local device content may
still render, but **login, registration and Admin access require Supabase
Auth** and will not work. There is no local password-account fallback.

## Not migrated by this schema yet

The following remain outside this schema and require a later migration if
full cross-device backend coverage is required:

- Resume file binary storage (currently IndexedDB on the device; do not move
  private resume files to an anonymous bucket/table without authenticated,
  owner-only access controls)
- Production Google Play Billing receipt verification

Current checkout can display Admin-configured manual UPI, payment-link, or
bank receiving details and records the Job Seeker-entered transaction/UTR
reference; Demo Checkout can also be enabled for testing. Manual-reference
activation is **not** independent bank/gateway verification and is not proof
of a real gateway or Google Play payment. Admin should cross-check manual
references, and production digital subscriptions should move to verified
payment-gateway/Google Play Billing receipt validation.

## Production security review required

This setup is ready for controlled testing, but it should receive a security
hardening pass before a large public launch:

- Identity/session authority is Supabase Auth, and Admin lists/settings now
  require a linked Admin Auth session. However, collection-sync,
  per-account user-state and purchase-recording RPCs still accept
  mobile-keyed parameters for compatibility and should eventually derive
  identity from `auth.uid()` or move to a protected server-side API. Direct
  table access remains revoked and RLS remains enabled.
- Forgot Password uses Supabase email reset links. Configure production
  SMTP, templates, rate limiting and abuse monitoring before scale; the
  pre-login mobile/email resolver also needs rate limiting.
- After the Auth-only client is production-verified, apply the cleaned
  schema drop statements so old custom-password RPCs and public-table
  password columns are permanently removed from the live database.
- Replace manual-reference/demo payment activation with verified
  gateway/Google Play Billing receipts.
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
- **Account created but cannot login**: confirm the email from Supabase
  first; check **Authentication → URL Configuration** allows the exact app
  origin that sent the confirmation/reset link.
- **Admin login says wrong password / no reset email**: create the
  registered Admin email once in **Authentication → Users → Add user**. A
  reset email is sent only for an existing Auth user.

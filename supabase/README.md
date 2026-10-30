# PharmaSales Jobs — Supabase activation checklist

This directory contains the database setup for **PharmaSales Jobs**. The app
is already coded to use Supabase for all three account roles:

- **Job Seeker** accounts in `public.app_accounts`
- **Recruiter** accounts in `public.app_accounts`
- **Admin** accounts in `public.app_admins`
- **Starter/Pro purchases and payments** in `public.app_purchases`
- **Live vacancies, pending approvals, support tickets, and deletion
  requests** in `public.app_sync_records`
- **Saved/applied jobs, candidate interests, and daily reveal state** in
  `public.app_user_states`

**Status: LIVE (30 Oct 2026).** Dedicated project **“Pharma sales jobs”**
(`https://zrkkjgxgykpnzeginbpq.supabase.co`, eu-west-3). This schema was
executed there via migrations `pharmasales_jobs_initial_schema`,
`fix_register_variable_conflict`, `admin_forgot_password_rpc`,
`cross_device_app_sync_and_candidate_privacy_v2`, and
`per_account_user_job_state_sync`, then verified end-to-end: Job Seeker and
Recruiter registration/login (mobile + email), Admin login by ID and
registered email, Admin Forgot Password reset with registered details,
purchase recording, Admin Users/Purchase/Payment lists through the public
API, cross-device record create/list/delete, per-account saved/applied state
create/read, cascade cleanup when the temporary test account was deleted,
and test-data cleanup. The anonymous candidate RPC now strips profile-photo
and resume-upload fields in the database response as well as in the UI.
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

- `public.app_accounts` — Job Seeker and Recruiter accounts/profiles
- `public.app_purchases` — purchase and payment records
- `public.app_admins` — Admin accounts with bcrypt password hashes
- `public.app_sync_records` — ordered cross-device vacancy/support records
- `public.app_user_states` — per-account saved/applied/reveal state
- Account registration, login, password, profile, deletion, candidate,
  purchase, Admin-list, collection-sync, and user-state RPC functions
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

### Google login for Job Seeker / Recruiter (enabled)

The app uses Supabase Auth only to verify the person's Google email. It then
matches that email to the existing `app_accounts` record for the selected
Job Seeker or Recruiter role. First-time Google users still add a mobile
number and create a password once, preserving mobile/email + password login.
Admin is excluded.

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
   https://3000-ilquizxjtw6bibxj3yiux.e2b.app
   http://localhost:3000
   ```

4. In **Supabase Dashboard → Authentication → Providers → Google**, enable
   Google and paste the Google **Client ID** and **Client Secret** there.
5. In **Supabase Dashboard → Authentication → URL Configuration**, keep the
   app origins in the redirect allow-list. The current preview origin and
   `http://localhost:3000` were allow-listed on 30 Oct 2026; add the final
   production domain later. The code returns to the current app origin after
   Google verifies the user.
6. Test both roles: an already-registered email should log in directly; a
   new Google email should ask for mobile number + password once.

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
7. Post/approve a test vacancy, raise a test support ticket, and save/apply
   to a test job; confirm the same records/state appear after signing in on
   another browser or device.
8. Confirm Admin login still works, then change the seeded Admin password.

Use clearly named test accounts and delete test data before production use.

## What this schema covers now

When both environment variables are present at build time, the app uses
Supabase for:

- Job Seeker and Recruiter registration
- Google email matching for enabled Job Seeker/Recruiter Google login
- Login by registered mobile **or** registered email
- Password setting/reset flows implemented by the app
- Job Seeker profile storage and updates
- Anonymous Recruiter candidate profiles
- Supported remote account-deletion calls
- Starter/Pro purchase/payment recording
- Live vacancies and pending-vacancy Admin approvals
- Support tickets and Job Seeker account-deletion requests
- Saved jobs, applied jobs, Recruiter candidate interests, and same-day
  free/sponsored reveal usage for the signed-in account
- Admin Users, Purchases, and Payments lists
- Admin login and Admin password changes, with the existing local fallback
  if the remote Admin RPC is unavailable

If the environment variables are absent, the app remains usable with its
existing **This Device** local-storage fallback.

## Not migrated by this schema yet

The following remain outside this schema and require a later migration if
full cross-device backend coverage is required:

- Resume file binary storage (currently IndexedDB on the device; do not move
  private resume files to an anonymous bucket/table without authenticated,
  owner-only access controls)
- Production Google Play Billing receipt verification

Current purchase records are generated by the preview's demo in-app
checkout. They are not proof of a real gateway or Google Play payment.

## Production security review required

This setup is ready for controlled testing, but it should receive a security
hardening pass before a large public launch:

- The current RPC design follows the app's custom account flow and grants
  function execution to `anon`/`authenticated`; Admin list, collection-sync,
  and user-state RPCs must eventually move behind Supabase Auth with
  authenticated user/Admin claims or a protected server-side API. Direct
  table access remains revoked and RLS remains enabled.
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

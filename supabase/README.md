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
- **Private Google Play purchase-token ledger** in
  `public.app_google_play_purchases` (server/service-role only; raw tokens
  are never returned to the browser/Admin UI)
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
share or store that Admin password in chat/GitHub. Legacy custom-password RPC definitions, browser grants, and public-table
password columns have been removed from the repository schema. The legacy
definitions remain live temporarily, but all browser (`anon`/`authenticated`)
execute access to them was revoked on 1 Nov 2026; after exact production-
bundle verification, apply the cleaned schema drop statements to remove the
definitions and password columns permanently from the live database.

**RPC anonymous-access hardening (1 Nov 2026).** Live migration
`harden_rpc_anonymous_access_20261101_v2` closes anonymous whole-collection
reads/writes. Sync reads/deletes now require Supabase Auth: live jobs are
signed-in only, pending vacancies are Admin-only, and support tickets /
deletion requests are visible only to Admin or the Auth-linked owner. Sync
writes are collection- and owner-checked; the only anonymous app-data write
is creating one **new open** support ticket, with no anonymous ticket
listing, updating or deleting. Purchases, per-account user state and
candidate profiles derive the owner/role from `auth.uid()`, and pre-login
account lookup no longer returns a non-owner's name, profile JSON or Auth
UUID. Internal helper functions and legacy custom-password RPCs have no
browser execute grants. Intentionally public reads are limited to the
minimized pre-login resolver, Admin-email resolver and non-personal
`commerce` setting.

**Payment recording hardening (1 Nov 2026).** Live migration
`harden_payment_recording_and_admin_status_20261101` makes
`record_app_purchase` derive the Starter/Pro amount, validity and expiry
from the Admin-managed `commerce` settings instead of trusting browser
values. It normalizes and validates the payment reference server-side
(exact non-repeated 12-digit UTR for UPI), requires an enabled/configured
payment method and paid status, rejects duplicate normalized references,
and serializes same-account/same-plan renewals. The Admin-only
`admin_update_app_purchase_status_auth` RPC lets Admin mark an unmatched
or fake reference **failed** from the Payment List, or confirm/restore a
checked payment as **paid**. Manual references still are not independent
bank verification; production should use verified gateway/Play Billing
receipts. The minimized pre-login account resolver still needs rate
limiting/abuse monitoring before a large launch.

**Google Play Billing backend (1 Nov 2026; disabled until owner setup).**
Live migration `add_google_play_billing_20261101` (version
`20261101083940`) created `public.app_google_play_purchases`, enabled RLS,
revoked all `anon`/`authenticated` table access, and added the
service-role-only `apply_google_play_purchase` and
`mark_google_play_purchase_finalized` RPCs. It also prevents the manual
Admin purchase-status RPC from overriding a Google-verified row. The
Supabase Edge Function `verify-google-play-purchase` is deployed (version 1,
ACTIVE, `verify_jwt=true`) from
`supabase/functions/verify-google-play-purchase/index.ts`. At deployment
check, the live `commerce` payload contained no `payment.googlePlay` object,
the app defaults Google Play Billing to OFF, no Google service-account
secrets exist, and the Google ledger had 0 rows. Verification therefore
fails closed with `503` and no Google purchase can activate a plan until the
owner completes [Google Play Billing activation](#google-play-billing-activation-owner-setup)
below and license-tester purchases pass.
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
- `public.app_google_play_purchases` — private Google Play token/order
  ledger used only by the service-role Edge Function for restore and
  subscription re-checks
- Auth profile lookup/link, profile, deletion, candidate, purchase,
  Admin-list, collection-sync, user-state, commerce-settings, and
  service-role-only Google Play apply/finalize RPC functions. The
  `verify-google-play-purchase` Edge Function source is in
  `supabase/functions/`; running `schema.sql` alone does not deploy that
  function or its secrets. When applied to an older installation, the schema also drops
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
   details). Payment Settings also contains a separate **Google Play
   Billing** section for the final Android package and product IDs; leave it
   OFF until the Google Play activation section below is complete. Save each
   settings change while signed in with the Admin Auth session (no separate
   password entry).
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
10. **Only after Google Play activation below:** install the internal-test
    Android build from Google Play (not Chrome/PWA), sign in with a license
    tester Job Seeker, and test one subscription and one one-time pass.
    Confirm server activation, Google order IDs in Purchase/Payment Lists,
    subscription acknowledgement, one-time consumption/rebuy, restore and
    pending-payment non-activation.

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
- Anonymous candidate profiles for signed-in Recruiters/Admin (no name/mobile/email)
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
- Google Play Billing client catalog/purchase/restore wiring plus deployed
  server-side token verification, subscription acknowledgement, one-time
  consumption and app-open subscription sync — **inactive** until Play
  Console products, final package/asset links and Edge secrets are set

If the environment variables are absent, public/local device content may
still render, but **login, registration and Admin access require Supabase
Auth** and will not work. There is no local password-account fallback.


## Google Play Billing activation (owner setup)

### Current state — deployed but intentionally inactive

- Database migration `add_google_play_billing_20261101` is live.
- Edge Function `verify-google-play-purchase` is deployed and requires a
  Supabase Auth JWT.
- The live commerce settings did not contain a `googlePlay` object when
  checked, so the new app normalizes it to **disabled** with a blank package
  and the planned product IDs.
- No Play Console app/products, final signing/asset-link verification,
  linked payments profile, Google service account, or Google Edge secrets
  have been created yet. The verifier returns `503` rather than granting a
  plan in this state.

### How verification works

1. Inside the verified Google Play TWA, the browser uses
   `getDigitalGoodsService('https://play.google.com/billing')`, Digital Goods
   `getDetails`/`listPurchases`, and a Payment Request for one exact SKU.
2. Google returns only a purchase token to the browser. The app sends the
   product ID and token to `verify-google-play-purchase` with the Job
   Seeker's Supabase Auth session; it does **not** grant the plan locally.
3. The Edge Function verifies the Auth user has a linked Job Seeker profile,
   loads the Admin product mapping, obtains a Google OAuth token from the
   service-account secret, and calls Google Play Developer API
   (`subscriptionsv2.get` for subscriptions and `products.get` for one-time
   products).
4. Only then does it call the service-role-only
   `apply_google_play_purchase` RPC. The RPC derives plan, price and
   one-time validity from `commerce` settings, stores the Google order ID in
   `app_purchases`, and stores the raw token only in the private
   `app_google_play_purchases` ledger for later subscription re-checks.
   Token hashes/order IDs are idempotent; a token already linked to another
   Job Seeker is rejected.
5. After entitlement is saved, the Edge Function acknowledges subscriptions
   and consumes one-time products. Consuming a one-time pass makes it
   buyable again. If finalization temporarily fails after entitlement is
   saved, restore/app-open sync retries it.
6. `PaymentResponse.complete('success')` is called by the browser only after
   the server returns a verified paid purchase. Pending/cancelled purchases
   do not activate the plan.

### Owner step A — final app and products

Complete [`android/README.md`](../android/README.md) first:

- final production domain and package ID;
- Play payments profile;
- active monthly base plans for `starter_monthly` and `pro_monthly`;
- active one-time purchase options for `starter_30_days` and
  `pro_30_days`;
- Play prices kept equal to Admin Plan Settings;
- signed internal-test AAB with Bubblewrap `playBilling.enabled=true`;
- production/test Digital Asset Links verified with the Play app-signing
  SHA-256 fingerprint;
- license testers added in Play Console.

### Owner step B — Google Cloud service account

1. In Google Cloud Console, create/select the project that will be linked to
   Play Console API access.
2. Enable **Google Play Android Developer API**
   (`androidpublisher.googleapis.com`).
3. Create a dedicated service account, for example
   `pharmasales-play-verifier`. Do not make it a broad Google Cloud project
   Owner for this app integration.
4. Create **one JSON key** for that service account. Download it once and
   keep the file outside this repository. **Never paste the JSON/private key
   into chat, GitHub, Admin Payment Settings, or a `VITE_` variable.**
5. In Play Console **Setup → API access**, link the same Google Cloud
   project if Play asks. Then use **Users and permissions** to invite the
   service-account email and grant access only to this app, including:
   - View app information/read-only access required by the API user;
   - **View financial data, orders, and cancellation survey responses**;
   - **Manage orders and subscriptions**.
6. Save/apply the permissions and allow time for Google permission
   propagation before the first API test. A `401`/`403` from the verifier
   usually means the API is not enabled, the Cloud project is not linked, or
   these app permissions are missing.

### Owner step C — Supabase Edge Function secrets

In Supabase Dashboard's Edge Function secret manager (or Supabase CLI from a
private, Git-ignored environment file outside the repo), set **either** the
full JSON secret **or** the split pair:

| Secret | Required value |
|---|---|
| `GOOGLE_PLAY_PACKAGE_NAME` | Final Android package ID. If set, it must match Admin Payment Settings. |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Preferred: complete service-account JSON (or base64 of that JSON). |
| `GOOGLE_PLAY_CLIENT_EMAIL` | Alternative to JSON: service-account `client_email`. |
| `GOOGLE_PLAY_PRIVATE_KEY` | Alternative to JSON: service-account PEM private key; escaped `\n` newlines are accepted. |

Do not set these as Netlify/`VITE_` variables. Do not send their values in
chat. Supabase's own `SUPABASE_URL`, publishable and secret/service-role Edge
environment values are injected by Supabase; the function supports both the
current key-dictionary names and legacy key names.

### Owner step D — Admin Payment Settings

After the new app build is deployed:

1. Login to Admin → **Payment Settings**.
2. Confirm Plan Settings prices/validity first.
3. In **Google Play Billing**, enter the final package name and exact IDs:
   `starter_monthly`, `starter_30_days`, `pro_monthly`, `pro_30_days`
   (or the exact replacement IDs actually created in Play Console).
4. Save once with Google Play OFF if you only want to persist IDs, then
   complete secrets/products/AAB/asset-link checks.
5. Switch Google Play Billing ON and save only when ready for
   license-tester purchases. The backend still fails closed if package,
   product, API-access or secret checks fail.
6. Keep manual UPI as currently selected if desired, but recheck Google
   Play payments/alternative-billing policy before Play submission because
   UPI remains visible inside the Android TWA UI.

### Owner step E — license-tester verification

Install from the Play internal-testing track using a license-test Google
account and confirm:

- subscription purchase/renewal/cancel-to-period-end;
- one-time pass purchase, server consumption, stacking and rebuy;
- Restore after reinstall with the same Google account and same Job Seeker;
- pending/deferred payment does not activate until Google reports it paid;
- Admin lists show only the Google order ID (never a raw purchase token);
- Admin manual Mark Invalid/Restore controls are unavailable for
  Google-verified rows;
- ordinary website checkout still offers UPI and explains Google Play is
  Android-app-only.

Real-time Developer Notifications (RTDN through Cloud Pub/Sub) and voided
purchase monitoring should be added before large-scale Play launch for
immediate renewal/refund/revocation changes. The current build re-checks
stored subscription tokens on app open and supports restore, but a consumed
one-time refund cannot be guaranteed to revoke instantly without RTDN or a
scheduled voided-purchases job.

## Not migrated by this schema yet

The following remain outside this schema and require a later migration if
full cross-device backend coverage is required:

- Resume file binary storage (currently IndexedDB on the device; do not move
  private resume files to an anonymous bucket/table without authenticated,
  owner-only access controls)
- Google Play Real-time Developer Notifications (RTDN) and scheduled
  voided-purchase reconciliation; purchase-time/restore/app-open server
  verification is implemented, but Play Console products/secrets/testing are
  still owner setup

Current checkout can display Admin-configured manual UPI, payment-link, or
bank receiving details and records the Job Seeker-entered transaction/UTR
reference. The database re-checks the enabled method and reference format
and derives amount/validity/expiry from Admin commerce settings, so a
browser or direct RPC caller cannot alter price or expiry. Manual-reference
activation is still **not** independent bank/gateway verification and is not
proof of a real gateway or Google Play payment. Admin should cross-check
manual references in the UPI/bank app and use Payment List → **Mark Invalid**
for an unmatched/fake reference (or **Restore Paid** if checked by mistake).
Production Google Play digital subscriptions now use server-side Google
token validation once the owner configuration above is completed. Manual
UPI/bank activation remains separate and must not be described as bank or
Google verification.

## Production security review required

This setup is ready for controlled testing, but it should receive a security
hardening pass before a large public launch:

- Identity/session authority is Supabase Auth. Collection-sync,
  per-account user-state, purchase and candidate RPCs derive ownership or
  Admin status from `auth.uid()`; direct table access remains revoked and
  RLS remains enabled. Before a large launch, add rate limiting/abuse
  monitoring to the minimized pre-login mobile/email resolver and to
  guest support-ticket creation (the one intentional anonymous write).
- Forgot Password uses Supabase email reset links. Configure production
  SMTP, templates, rate limiting and abuse monitoring before scale.
- After the exact production bundle is verified, apply the cleaned schema
  drop statements so old custom-password RPC definitions and public-table
  password columns are permanently removed from the live database (browser
  execute access to those RPCs is already revoked).
- Manual-reference payment activation is still not bank verification;
  cross-check references and use the Admin Payment List status controls for
  unmatched manual payments. Google Play rows are server-verified and are
  intentionally excluded from those manual status controls. Before large
  Play scale, add RTDN/voided-purchase reconciliation and recheck Play
  payments/alternative-billing policy for showing UPI in the Play TWA.
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
- **Google Play button says Android app / Setup pending**: ordinary web and
  PWA installs do not expose Play Digital Goods. Install the verified TWA
  from a Play test track; then confirm final package/asset links, active
  base plans/purchase options, license tester, country/price availability
  and exact product IDs.
- **Google verifier returns 503**: Google Play is OFF, package/product IDs
  are incomplete or mismatched, Edge secrets are missing, or the service
  account lacks Play API/app permissions. It deliberately does not grant a
  plan in that state.
- **Google verifier returns 409**: the purchase token/order is already
  linked to another PharmaSales Jobs Job Seeker. Sign in with the account
  that first restored/purchased it; do not edit the private token ledger by
  hand.

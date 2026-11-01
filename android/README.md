# Android — Play Store Upload (TWA + Bubblewrap)

> **Status: code and server verification are ready; owner setup is still
> required.** The app, database and Supabase Edge Function now contain Google
> Play Billing support for monthly subscriptions and one-time 30-day passes.
> Google Play purchases remain **disabled/fail-closed** until the final
> production domain/package, Play Console app/products, signing/asset links,
> Google service-account access and Supabase secrets below are completed and
> tested. The domain/package values currently present in
> `public/twa-manifest.json` and `public/.well-known/assetlinks.json` are
> placeholders, not confirmed production identifiers. Do not charge production
> users through Google Play until every step in this guide passes with a
> license tester.

Manual UPI/payment-link/bank checkout remains visible beside Google Play in
the app, as selected for this project. Google Play purchase buttons work only
inside the verified Android TWA installed from Google Play; on the ordinary
website, checkout explains that limitation and the Job Seeker can use UPI or
another enabled manual method.

> **Play policy check before submission:** digital subscriptions sold inside
> a Play-distributed app are generally subject to Google Play's payments
> policy. Showing UPI/manual alternatives inside the Play TWA may require an
> applicable exception or alternative-billing enrollment, or Play may reject
> the submission. Recheck the current policy for India and this app category
> immediately before submitting. Do not assume the present “show both” UI is
> automatically policy-approved.

## 1. Final domain, package and hosting

1. Connect the purchased production domain and host the built `dist/` at
   `https://YOUR_PURCHASED_DOMAIN`.
2. Choose the final Android package ID once. A Play app's package ID cannot
   be changed after the app is created.
3. Ensure these are reachable without an unexpected redirect:
   - `https://YOUR_PURCHASED_DOMAIN/manifest.json`
   - `https://YOUR_PURCHASED_DOMAIN/.well-known/assetlinks.json`
4. Replace the placeholder host/package/icon URLs in
   `public/twa-manifest.json` and the package in
   `public/.well-known/assetlinks.json` with the final values.
5. Add the production domain to Supabase Auth URL Configuration and to the
   Google OAuth client's Authorized JavaScript origins before testing Google
   login there.
6. After Play signs the release, copy the **app signing key** SHA-256
   fingerprint from Play Console into `.well-known/assetlinks.json`,
   redeploy the website and verify Digital Asset Links. Include an upload-key
   fingerprint as well if you also test a locally installed signed build.

`public/twa-manifest.json` already contains:

```json
"features": {
  "playBilling": { "enabled": true }
}
```

Keep Play Billing enabled in the Bubblewrap/TWA configuration. Play Billing
still will not sell anything until the Play products and server secrets are
configured and Admin switches Google Play Billing ON in Payment Settings.

## 2. Create the Play Console app and payments profile

1. Create the app as **PharmaSales Jobs — The MR to NSM Jobs Network** using
   `YOUR_FINAL_PACKAGE_ID`.
2. Complete/link the Play payments profile, tax and bank/payout details.
   In-app products cannot be sold until the merchant/payments setup required
   by Play Console is complete.
3. Upload a signed internal-testing AAB built with the final package/domain.
4. Add the Google accounts used for purchase testing under Play Console
   **Settings → License testing**. License testers should also be testers on
   the internal/closed testing track used to install the app.

## 3. Create exactly these Play products

The planned product IDs below already match the app defaults. Product IDs are
permanent. If different IDs are created, enter those exact IDs in Admin →
Payment Settings instead; do not leave a mixed set of old and new IDs.

| Product ID | Play product type | App entitlement | Setup |
|---|---|---|---|
| `starter_monthly` | Subscription | Starter | Create and activate one automatically renewing **monthly** base plan. Set its India price to the current Starter price in Admin Plan Settings (currently ₹99). |
| `starter_30_days` | One-time product | Starter for the Admin-set validity | Create and activate a purchase option at the current Starter price. The server grants the Starter validity (currently 30 days), then consumes the purchase so it can be bought again. |
| `pro_monthly` | Subscription | Pro | Create and activate one automatically renewing **monthly** base plan. Set its India price to the current Pro price in Admin Plan Settings (currently ₹499). |
| `pro_30_days` | One-time product | Pro for the Admin-set validity | Create and activate a purchase option at the current Pro price. The server grants the Pro validity (currently 30 days), then consumes the purchase so it can be bought again. |

Important product rules:

- A subscription product by itself is not purchasable until an eligible base
  plan/offer is active for the test track/country.
- Keep the Play Console prices synchronized with Admin Plan Settings. The
  database records the Admin-configured plan price; it does not silently
  trust a browser-displayed price.
- Google sets a subscription's current-period expiry. The server stores that
  expiry after verifying with Google.
- A one-time pass uses the validity days from Admin Plan Settings and stacks
  after an existing future expiry for the same plan, like a manual renewal.

## 4. Build and upload the AAB with Bubblewrap

Replace all placeholders first, then run:

```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://YOUR_PURCHASED_DOMAIN/manifest.json
# prompts:
# packageId: YOUR_FINAL_PACKAGE_ID
# host: YOUR_PURCHASED_DOMAIN
# enable Play Billing: yes
# enable notifications: choose based on the final release scope
bubblewrap build
# outputs: ./app-release-bundle.aab (+ signing key)
```

Keep the signing key and its passwords outside GitHub. Never commit a
keystore, Play service-account JSON, private key or production secret.

Upload the AAB to an **internal testing** track first. A sideloaded APK,
ordinary Chrome tab or installed website PWA is not a valid Google Play
Billing test: Digital Goods must be available through the verified TWA
installed from Play.

## 5. Configure server verification and Admin IDs

Complete the Google Cloud service-account and Supabase secret steps in
[`../supabase/README.md`](../supabase/README.md#google-play-billing-activation-owner-setup).
In short:

1. Enable the Google Play Android Developer API
   (`androidpublisher.googleapis.com`) in a Google Cloud project.
2. Create a dedicated service account and one JSON key; store the key only as
   a Supabase Edge Function secret. Never paste it into Admin Payment
   Settings, GitHub or chat.
3. Link/invite that service-account email in Play Console with app access to
   view app/financial/order data and manage orders/subscriptions.
4. Add `GOOGLE_PLAY_PACKAGE_NAME` and
   `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` (or the supported split email/key
   secrets) to Supabase Edge Function secrets.
5. In Admin → **Payment Settings → Google Play Billing**, enter the final
   package name and all four exact product IDs. Save.
6. Switch **Google Play Billing ON** only after the products are active, the
   AAB is installed from the test track, asset links verify, and you are
   ready to run the license-tester checklist.

The deployed Supabase Edge Function is `verify-google-play-purchase`. It
returns a fail-closed `503` until settings, package/product IDs and the
service-account secret are all present.

## 6. License-tester checklist

Install the internal-test build **from Google Play** using a license-test
Google account, sign in as a Job Seeker, and verify each case:

- Starter monthly subscription purchase activates only after server
  verification; Admin Purchase/Payment Lists show Google order ID, Starter,
  amount and Google's current-period expiry.
- Cancelling the subscription in Google Play keeps access until the current
  period ends; reopening the app syncs the Google state.
- Pro monthly subscription purchase follows the same flow.
- Starter 30-day one-time pass activates, is consumed on the server, and can
  be bought again; a repeat purchase stacks after the future Starter expiry.
- Pro 30-day one-time pass follows the same flow.
- Reinstall/sign in again and use **Restore Google Play Purchase**; the
  purchase relinks only to the same signed-in Job Seeker account.
- A pending/deferred payment does not activate the plan until Google reports
  it purchased/active.
- A cancelled payment sheet and a purchase token for another product/account
  do not activate a plan.
- The ordinary website shows an “Android app” reason for Google Play while
  UPI remains usable.

Real-time Developer Notifications (RTDN via Cloud Pub/Sub) are the
recommended scale-up follow-up for immediate renewal, hold, refund and
revocation sync. The current implementation verifies at purchase/restore and
re-checks stored subscription tokens when a signed-in seeker opens the app.

## 7. Play Console release steps

- Complete Data Safety, Content Rating, Ads declaration, target audience,
  account-deletion details, subscription/app-content declarations asked by
  Play Console, and the Privacy Policy URL
  (`https://YOUR_PURCHASED_DOMAIN/privacy-policy.html`).
- Add real phone screenshots (1080x1920), feature graphic (1024x500), and the
  final 512x512 icon.
- Verify production Digital Asset Links with the Play app-signing SHA-256.
- Recheck Google Play payments/alternative-billing policy because manual UPI
  remains visible in the app UI.
- Do not move from internal testing to production until license-tester
  subscription, one-time, restore, pending and cancellation cases pass.

## 8. Ads and PWA behavior

- The current sponsored placements are in-app placements, not production
  AdMob. Add production AdMob IDs only when the AdMob account/app is created.
- Manual UPI/bank references are not independent proof of bank settlement;
  Admin must cross-check them in the receiving app. Google Play purchases are
  different: the backend verifies them directly with Google before granting
  entitlement.
- Web updates deploy through hosting; a TWA normally reflects them without a
  new AAB unless native/package configuration changes.

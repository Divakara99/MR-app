# Android — Play Store Upload (TWA + Bubblewrap)

> **Status: owner inputs still required.** Do not build or upload a production
> AAB until the purchased production domain is connected and the final Android
> package ID is chosen. The domain/package values currently present in
> `public/twa-manifest.json` and `public/.well-known/assetlinks.json` are
> placeholders, not confirmed production identifiers.

## 1. Domain & Hosting

- Host the built `dist/` at `https://YOUR_PURCHASED_DOMAIN`.
- Ensure `https://YOUR_PURCHASED_DOMAIN/manifest.json` and
  `https://YOUR_PURCHASED_DOMAIN/.well-known/assetlinks.json` are reachable.
- Add the production domain to Supabase Auth URL Configuration and to the
  Google OAuth client's Authorized JavaScript origins before testing Google
  login there.

## 2. Build AAB with Bubblewrap (TWA)

Replace the placeholders first, then run:

```bash
npm i -g @bubblewrap/cli
bubblewrap init --manifest https://YOUR_PURCHASED_DOMAIN/manifest.json
# prompts:
# packageId: YOUR_FINAL_PACKAGE_ID
# host: YOUR_PURCHASED_DOMAIN
# enable Play Billing: only after real Play products and receipt verification exist
# enable notifications: choose based on the final release scope
bubblewrap build
# outputs: ./app-release-bundle.aab (+ signing key)
```

Keep the signing key and its passwords outside GitHub. Never commit a
keystore, Play service-account JSON, or production secret.

## 3. Ads and Billing

- The current sponsored placements are in-app placements, and Starter/Pro
  checkout uses Admin-configured manual UPI/payment-link/bank receiving
  details. They are not production AdMob or Google Play Billing integrations.
- Add production AdMob IDs only when the AdMob account/app is created.
- Create Play subscription/product IDs and implement server-side receipt
  verification before charging real users through Google Play. Do not treat a
  locally recorded manual payment reference as independent proof of payment.

## 4. Play Console Steps

- Create the app as **PharmaSales Jobs — The MR to NSM Jobs Network** using
  `YOUR_FINAL_PACKAGE_ID`.
- Upload the signed `app-release-bundle.aab`.
- Complete Data Safety, Content Rating, Ads declaration, target audience,
  account-deletion details, and the Privacy Policy URL
  (`https://YOUR_PURCHASED_DOMAIN/privacy-policy.html`).
- Add real phone screenshots (1080x1920), feature graphic (1024x500), and the
  final 512x512 icon.
- Copy the SHA-256 signing fingerprint from Play Console into
  `.well-known/assetlinks.json`, redeploy the website, and verify Digital
  Asset Links before release.

## 5. PWA stays primary

- Web updates deploy through hosting; a TWA normally reflects them without a
  new AAB unless native/package configuration changes.

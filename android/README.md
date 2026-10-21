# Android — Play Store Upload (TWA + Bubblewrap)

## 1. Domain & Hosting
- Host the built `dist/` at `https://mrvacancieshub.in` (or your domain).
- Ensure `https://yourdomain.com/manifest.json` and `https://yourdomain.com/.well-known/assetlinks.json` are reachable (we generated them in `public/`).

## 2. Build AAB with Bubblewrap (TWA)
```bash
npm i -g @bubblewrap/cli
# init from hosted manifest
bubblewrap init --manifest https://mrvacancieshub.in/manifest.json
# prompts:
# packageId: com.mrvacancieshub.app
# host: mrvacancieshub.in
# enable Play Billing: Yes
# enable notifications: Yes
bubblewrap build
# outputs: ./app-release-bundle.aab  (+ signing key)
```
Or `bubblewrap build` uses local `public/twa-manifest.json` if you copy it to bubblewrap project root.

## 3. AdMob (Production IDs)
Replace test IDs in `src/App.tsx` & `AndroidManifest.xml`:
- Banner, Interstitial, Rewarded, Native, App ID
- Add to `AndroidManifest.xml`:
```xml
<meta-data
  android:name="com.google.android.gms.ads.APPLICATION_ID"
  android:value="ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY"/>
```

## 4. Play Console Steps
- Create app: `PharmaSales Jobs — The MR to NSM Jobs Network`, package `com.mrvacancieshub.app`
- Upload `app-release-bundle.aab`
- Complete: Data Safety (contact, app activity, ads), Content Rating questionnaire (Everyone), Ads declaration (Yes), Privacy Policy URL (`https://yourdomain.com/privacy-policy.html`), In-app products (subscriptions: starter_monthly, pro_monthly (Job Seeker plans only; no Recruiter plan)), Screenshots (1080x1920) + Feature graphic 1024x500 + Icon 512x512.
- Digital Asset Links: copy SHA256 from Play Console → Signing → paste into `.well-known/assetlinks.json`, redeploy, verify at `https://digitalassetlinks.googleapis.com`.

## 5. PWA stays primary
- Updates deploy via web hosting — TWA auto-updates without new AAB unless native features change.

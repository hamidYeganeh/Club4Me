# Android offline operation and live updates

The Android release now runs the web bundle from the APK/device, rather than loading `app.gym4me.ir` as its application shell. The public Next.js site keeps its normal server build. Capacitor's hosted/development mode remains available for development and is not the offline release path.

## Shared application, two build targets

`npm run build` builds the Next.js site. `npm run build:cap` builds the existing React screens into `out/` using Vite, then records the native runtime fingerprint in `out/native-release.json`. The native route registry reads the same `app/**/page.tsx` and nested layouts. A small build adapter replaces `await params`/`await searchParams` in page wrappers with locally resolved parameters and removes `generateStaticParams`. It rejects other server-side async work. Native adapters provide the navigation, link and image APIs used by these screens. No catalogue or reservation IDs need to exist at build time.

Keep product logic in shared client screens. A new server-only page must have its server work moved into a shared client screen before it can ship in the Android bundle. Root providers and UI live in `components/application-shell.tsx`, shared with Next.js. Bundled images, styles and fonts are local. Remote images/videos are not proactively downloaded by this infrastructure; add explicit media download policies when introducing workout media.

## Offline data and account isolation

The application opts into an IndexedDB cache through `AppApiProvider`; admin and business clients do not enable this persistence. Cached queries are restored before account gates render. The allowlist in `packages/api/src/offline/cache.ts` currently includes account/profile choices, reservations, athlete bookings/enrollments, saved items, notifications and discovery data. Financial balances, available capacity, administrative queries and mutation results are excluded. Snapshots are limited to seven days, 150 queries and approximately 4 MB. First login and data never downloaded still require internet.

Cache and outbox namespaces are derived from the API environment and account identity, never from a token stored in clear text as a database key. Refreshing a JWT retains the account namespace. Switching accounts creates a fresh QueryClient; logging out clears that session's cache and pending queue. An unavailable/quota-limited database falls back to online operation and shows a status message. It never reports an offline write as saved unless its IndexedDB transaction committed.

The current product has no workout logging module. The persistence/sync primitives are ready for such a module; this change does not invent workout records or endpoints.

## Synchronization

`OfflineOutbox` accepts only registered operation types. The first integration is `favorites.set`: its PUT/DELETE endpoints are idempotent, and repeated changes to the same item coalesce into the latest desired state. Pending intent overlays refetched server data. The queue retries on reconnect, foregrounding and a 30-second interval while the application is open. It survives closing the process. This is not an Android background service.

Temporary/network/authentication failures retain the operation. Permanent rejection remains visible until the user discards it. Every replay is bound to the originating account, including HTTP authentication retries. Logout discards unsent changes for that account. Payments, bookings, cancellations and other mutations remain online operations and are not queued for unexpected execution later.

To add an offline operation: define a versioned payload and validation, provide an idempotent backend operation (or server-side idempotency keys), register its handler, and implement its optimistic overlay/conflict behavior. Do not enqueue arbitrary URLs or financial operations.

## Signing and runtime compatibility

The Android APK embeds a public RSA key, a manifest URL and a runtime fingerprint through `UpdateConfigurationPlugin`. These values are read from the native binary, not from a downloaded bundle. The fingerprint covers native sources/resources/configuration, actual native dependency versions, the public key, update origin and demo/development build mode. Native changes therefore use a different update directory and need a new APK. Keep the same environment for build, sync, verification and packaging.

`@capawesome/capacitor-live-update` handles native ZIP verification, staging and rollback. Both the manifest and ZIP are signed with RSA-SHA256. Downloads must use HTTPS and the same origin as the manifest. The client validates the runtime, refuses blocked bundles, downloads in the background and stages the bundle for the next native launch. It never reloads the running UI to apply an update. A route must commit successfully and call `LiveUpdate.ready()` within 30 seconds; otherwise the native plugin returns to the built-in bundle and blocks the failed bundle.

## First local setup

Run commands from `apps/application`:

```sh
npm run ota:keygen
npm run cap:sync:android
npm run android:apk
```

`ota:keygen` creates `.ota/private.pem` (mode 0600) and `.ota/public.pem` and refuses to overwrite them. `.ota` and PEM files are ignored by Git. Preserve the private key in your signing secret store; do not upload it with application assets. If keys already exist, skip key generation. Losing or changing the key means building a new APK with a new public key. APK signing uses the existing Android keystore configuration and is separate from OTA signing.

For an APK without Firebase, use `npm run cap:apk`. It builds, syncs and verifies with `CAPACITOR_DEMO=1`. Demo and production have different runtime fingerprints. Run `CAPACITOR_DEMO=1 npm run ota:package` when preparing a matching demo update.

Optional build variables:

| Variable               | Default                             |
| ---------------------- | ----------------------------------- |
| `OTA_PUBLIC_KEY_PATH`  | `apps/application/.ota/public.pem`  |
| `OTA_PRIVATE_KEY_PATH` | `apps/application/.ota/private.pem` |
| `OTA_BASE_URL`         | `https://app.gym4me.ir/updates`     |

Without a public key, live update delivery is disabled, while the local app and offline data still work. Set `NEXT_PUBLIC_API_URL` as usual for the native build. The API's `CORS_ORIGINS` must explicitly include `https://localhost`, the Android local web origin. Production validation allows this exact origin; arbitrary loopback hosts/ports remain rejected.

## Preparing and serving updates

```sh
npm run build:cap
npm run ota:package
```

The packager verifies that the signing key and current native fingerprint match the web build. It creates `release-artifacts/<runtime>/web-<sha256>.zip`, its signed manifest, and `latest.json`. These commands only prepare local artifacts; they do not publish or contact an update service.

Serve that directory at `OTA_BASE_URL`, preserving `<runtime>/...`. Upload the ZIP first, then atomically replace `latest.json`. The server must send `Access-Control-Allow-Origin: https://localhost` for manifests, serve `latest.json` with `Cache-Control: no-store`, and serve immutable ZIPs with long-lived caching. No Capawesome Cloud account is needed. A missing manifest (404/204), interrupted download or unavailable server leaves the installed app usable.

To roll back a release deliberately, replace `latest.json` with a previous signed `web-<sha256>.json` from the same runtime and keep its ZIP available. An already staged update can still apply before the next manifest check; do not treat changing server metadata as an instantaneous recall. A bundle previously blocked after a startup failure is not retried automatically.

Existing hosted installations need one APK update to install this native runtime. Their site-origin storage cannot be read from the new local origin, so users may need to log in again. A newly installed APK includes a working baseline and does not require an update download before opening.

## Verification

```sh
npm run test:offline
npm run build:cap
npm run test:native
npm run check-types
```

Unit tests cover cache persistence/expiry/isolation, durable queue behavior, replay failures and session binding, immediate rejection of offline financial writes, native route adaptation, signed manifests, native compatibility and failed downloads. Browser integration tests run the actual native web build with a simulated on-device file server, blocked API traffic and persistent browser storage. They cover reopening cached reservations offline, new dynamic routes, queued favorites across a restart and account isolation. Native ZIP installation/rollback must additionally be verified on Android with the matching APK before production rollout.

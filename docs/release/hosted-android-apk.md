# Android APK backed by the VPS

The standard APK loads `https://app.gym4me.ir` directly inside Capacitor while
retaining native Android plugins. An internet connection is required. Each cold
launch fetches the current deployed web application; subsequent website changes
require only a normal deployment, with no APK rebuild or separate OTA package.
An already open app continues its current session until reloaded or fully closed
and reopened. Native changes (plugins, permissions, app identity, Android SDK or
signing) still require a new APK installation.

## Build

Use Java 21 (for example the JBR bundled with Android Studio) and Android SDK 36:

```sh
npm run cap:apk -w apps/application
```

`cap:apk` runs `android:hosted`, synchronizes the hosted configuration and verifies
that the packaged server URL is exactly `https://app.gym4me.ir`, HTTPS is enforced,
and offline bundle updates are disabled. CI debug builds and the signed Android
release workflow use the same hosted synchronization.

To set a new Android version explicitly:

```sh
npm run cap:sync:hosted -w apps/application
cd apps/application/android
./gradlew --no-daemon :app:assembleDebug \
  -PGYM4ME_VERSION_CODE=2 -PGYM4ME_VERSION_NAME=1.0.1
```

Output: `apps/application/android/app/build/outputs/apk/debug/app-debug.apk`.
The debug APK uses the existing local debug signing key and is intended for direct
installation, not a store release. Install it once over a compatible existing
installation, then web deployments are loaded automatically on cold launch.

For a signed release, configure `GYM4ME_ANDROID_KEYSTORE`,
`GYM4ME_ANDROID_KEYSTORE_PASSWORD`, `GYM4ME_ANDROID_KEY_ALIAS`, and
`GYM4ME_ANDROID_KEY_PASSWORD`; run hosted sync before `:app:assembleRelease` or
`:app:bundleRelease`. Increase `GYM4ME_VERSION_CODE` for every new native release.

The separate offline build remains available through `npm run android:demo`.
It uses local bundles and its own OTA publishing flow; normal website deployment
does not update an older installed offline APK. Install the hosted APK to switch.

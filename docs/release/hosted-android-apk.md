# Android APK backed by the VPS

The current application includes server-rendered membership and reservation
routes that cannot be bundled with Next.js static export. The hosted Android
configuration loads `https://app.gym4me.ir` inside Capacitor and requires an
internet connection. It retains the native Android plugins.

Build an installable debug APK after deploying the application:

```sh
npm run cap:sync:hosted -w apps/application
cd apps/application/android
./gradlew --no-daemon :app:assembleDebug
```

Use Java 21 and an Android SDK with platform 36. The APK is written to
`apps/application/android/app/build/outputs/apk/debug/app-debug.apk`.
This artifact uses the local debug signing key and is intended for direct
installation and testing, not a store release.

To target another HTTPS deployment, run `cap sync android` from the application
directory with `CAPACITOR_SERVER_URL` set to that origin. HTTP URLs are rejected.
Without this variable, the existing bundled static-export configuration remains
available, but its dynamic routes need to be adapted before it can build.

For a signed release APK, configure the existing `GYM4ME_ANDROID_KEYSTORE`,
`GYM4ME_ANDROID_KEYSTORE_PASSWORD`, `GYM4ME_ANDROID_KEY_ALIAS`, and
`GYM4ME_ANDROID_KEY_PASSWORD` environment variables and use `:app:assembleRelease`.
Increment `GYM4ME_VERSION_CODE` when publishing an update.

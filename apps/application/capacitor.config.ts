import type { CapacitorConfig } from "@capacitor/cli";
import { KeyboardResize, KeyboardStyle } from "@capacitor/keyboard";
import "@capawesome/capacitor-live-update";
import { nativeUpdateConfiguration } from "./scripts/native-runtime.mjs";

const devServerUrl = process.env.CAPACITOR_DEV_URL;
const hostedServerUrl = process.env.CAPACITOR_SERVER_URL;
if (hostedServerUrl && new URL(hostedServerUrl).protocol !== "https:") {
  throw new Error("CAPACITOR_SERVER_URL must use HTTPS");
}
const allowCleartext =
  process.env.CAPACITOR_ALLOW_CLEARTEXT === "1" || Boolean(devServerUrl);
const isDemoBuild = process.env.CAPACITOR_DEMO === "1";
const updates = nativeUpdateConfiguration();

const config: CapacitorConfig = {
  appId: "com.gym4me.app",
  appName: "Gym4Me",
  webDir: hostedServerUrl ? "native-shell" : "out",
  backgroundColor: "#1eff6d",
  android: {
    allowMixedContent: allowCleartext,
    ...(isDemoBuild
      ? {
          // The demo APK works without Firebase credentials. Production syncs
          // include PushNotifications after google-services.json is supplied.
          includePlugins: [
            "@capacitor/app",
            "@capacitor/keyboard",
            "@capacitor/network",
            "@capacitor/preferences",
            "@capacitor/splash-screen",
            "@capacitor/status-bar",
            "@capawesome/capacitor-live-update",
          ],
        }
      : {}),
  },
  ios: {
    contentInset: "automatic",
    preferredContentMode: "mobile",
  },
  plugins: {
    UpdateConfiguration: {
      enabled: updates.enabled && !hostedServerUrl && !devServerUrl,
      runtimeVersion: updates.runtimeVersion,
      manifestUrl: updates.manifestUrl,
      publicKey: updates.publicKey,
    },
    LiveUpdate: {
      publicKey: updates.publicKey || undefined,
      readyTimeout: hostedServerUrl || devServerUrl ? 0 : 30_000,
      autoBlockRolledBackBundles: true,
      autoDeleteBundles: true,
      autoUpdateStrategy: "none",
    },
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#1eff6d",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      splashFullScreen: true,
      splashImmersive: true,
      showSpinner: false,
    },
    StatusBar: {
      style: "DARK",
      overlaysWebView: true,
    },
    Keyboard: {
      resize: KeyboardResize.Native,
      style: KeyboardStyle.Dark,
      resizeOnFullScreen: true,
    },
  },
  server: {
    androidScheme: "https",
    iosScheme: "https",
    ...(hostedServerUrl
      ? { url: hostedServerUrl, cleartext: false }
      : devServerUrl
        ? {
            url: devServerUrl,
            cleartext: true,
          }
        : {}),
  },
};

export default config;

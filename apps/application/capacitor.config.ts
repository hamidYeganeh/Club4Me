import type { CapacitorConfig } from "@capacitor/cli";
import { KeyboardResize, KeyboardStyle } from "@capacitor/keyboard";

const devServerUrl = process.env.CAPACITOR_DEV_URL;
const allowCleartext =
  process.env.CAPACITOR_ALLOW_CLEARTEXT === "1" || Boolean(devServerUrl);
const isDemoBuild = process.env.CAPACITOR_DEMO === "1";

const config: CapacitorConfig = {
  appId: "com.gym4me.application",
  appName: "Gym4Me",
  webDir: "out",
  backgroundColor: "#c6ff4e",
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
          ],
        }
      : {}),
  },
  ios: {
    contentInset: "automatic",
    preferredContentMode: "mobile",
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: "#c6ff4e",
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
    ...(devServerUrl
      ? {
          url: devServerUrl,
          cleartext: true,
        }
      : {}),
  },
};

export default config;

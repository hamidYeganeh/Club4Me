import { Capacitor, registerPlugin } from "@capacitor/core";

type NativeBiometricAuthPlugin = {
  isAvailable(): Promise<{ available: boolean }>;
  authenticate(options: {
    title: string;
    subtitle: string;
    cancelButtonText: string;
  }): Promise<void>;
};

const nativeBiometricAuth =
  registerPlugin<NativeBiometricAuthPlugin>("BiometricAuth");

export const biometricAuth = {
  isSupported: () =>
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android",
  async isAvailable() {
    if (!this.isSupported()) return false;
    return (await nativeBiometricAuth.isAvailable()).available;
  },
  authenticate() {
    return nativeBiometricAuth.authenticate({
      title: "ورود به Gym4Me",
      subtitle: "برای ورود، هویت خود را تأیید کنید",
      cancelButtonText: "ورود با رمز عبور",
    });
  },
};

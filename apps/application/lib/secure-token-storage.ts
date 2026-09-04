import { Capacitor, registerPlugin } from "@capacitor/core";

type NativeSecureStoragePlugin = {
  getItem(options: { key: string }): Promise<{ value: string | null }>;
  setItem(options: { key: string; value: string }): Promise<void>;
  removeItem(options: { key: string }): Promise<void>;
};

const nativeStorage =
  registerPlugin<NativeSecureStoragePlugin>("SecureTokenStorage");

export const secureTokenStorage = {
  isAvailable: () =>
    Capacitor.isNativePlatform() && Capacitor.getPlatform() === "android",
  async getItem(key: string) {
    return (await nativeStorage.getItem({ key })).value;
  },
  setItem(key: string, value: string) {
    return nativeStorage.setItem({ key, value });
  },
  removeItem(key: string) {
    return nativeStorage.removeItem({ key });
  },
};

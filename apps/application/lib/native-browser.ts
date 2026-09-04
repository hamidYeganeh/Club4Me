import { Capacitor, registerPlugin } from "@capacitor/core";

type NativeBrowserPlugin = {
  open(options: { url: string }): Promise<{ opened: boolean }>;
};

const nativeBrowser = registerPlugin<NativeBrowserPlugin>("NativeBrowser");

export async function openExternalUrl(url: string): Promise<void> {
  if (Capacitor.getPlatform() === "android") {
    await nativeBrowser.open({ url });
    return;
  }

  window.open(url, "_blank", "noopener,noreferrer");
}

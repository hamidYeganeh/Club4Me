import { Capacitor, registerPlugin } from "@capacitor/core";
import { App } from "@capacitor/app";
import { LiveUpdate } from "@capawesome/capacitor-live-update";
import { stageLiveUpdate } from "./update-protocol";

type NativeUpdateConfiguration = {
  enabled: boolean;
  runtimeVersion: string;
  manifestUrl: string;
  publicKey: string;
};
const configuration = registerPlugin<{
  getConfig(): Promise<NativeUpdateConfiguration>;
}>("UpdateConfiguration");
let started = false;

/** Called only after a route has committed successfully; no API response is needed to become ready. */
export async function startLiveUpdates() {
  if (
    started ||
    Capacitor.getPlatform() !== "android" ||
    !Capacitor.isPluginAvailable("LiveUpdate")
  )
    return;
  started = true;
  try {
    await LiveUpdate.ready();
  } catch {
    return;
  }
  let checking = false;
  let lastCheck = 0;
  const check = async () => {
    if (checking || !navigator.onLine || Date.now() - lastCheck < 60_000)
      return;
    checking = true;
    lastCheck = Date.now();
    try {
      const config = await configuration.getConfig();
      if (config.enabled) await stageLiveUpdate(config, LiveUpdate);
    } catch (error) {
      // An unavailable update server must never stop the installed app.
      console.warn(
        "Live update was not staged",
        error instanceof Error ? error.message : "Unknown error",
      );
    } finally {
      checking = false;
    }
  };
  window.addEventListener("online", () => {
    lastCheck = 0;
    void check();
  });
  await App.addListener("appStateChange", ({ isActive }) => {
    if (isActive) void check();
  });
  void check();
}

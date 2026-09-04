"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Network } from "@capacitor/network";

export function NetworkStatus() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let mounted = true;
    const update = (connected: boolean) => mounted && setOffline(!connected);
    if (Capacitor.isNativePlatform()) {
      void Network.getStatus().then((status) => update(status.connected));
      const listener = Network.addListener("networkStatusChange", (status) =>
        update(status.connected),
      );
      return () => {
        mounted = false;
        void listener.then((handle) => handle.remove());
      };
    }
    const onOnline = () => update(true);
    const onOffline = () => update(false);
    update(navigator.onLine);
    window.addEventListener("online", onOnline);
    window.addEventListener("offline", onOffline);
    return () => {
      mounted = false;
      window.removeEventListener("online", onOnline);
      window.removeEventListener("offline", onOffline);
    };
  }, []);

  if (!offline) return null;
  return (
    <div
      className="fixed inset-x-3 top-[calc(env(safe-area-inset-top)+0.5rem)] z-[1200] mx-auto w-[calc(100%_-_1.5rem)] max-w-lg rounded-2xl border border-warning/30 bg-warning/95 px-4 py-3 text-center text-sm font-semibold text-black shadow-xl"
      role="status"
    >
      اینترنت قطع است؛ بعضی اطلاعات ممکن است به‌روز نباشند.
    </div>
  );
}

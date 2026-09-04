"use client";

import { useEffect } from "react";

import { setupPushNotifications } from "@/lib/push-notifications";

export function AppPushNotifications() {
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    void setupPushNotifications()
      .then((result) => {
        cleanup = result;
      })
      .catch((error) => console.error("Push setup failed", error));
    return () => cleanup?.();
  }, []);

  return null;
}

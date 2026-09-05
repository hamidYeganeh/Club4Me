"use client";

import { useEffect } from "react";

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

export function Observability() {
  useEffect(() => {
    if (!DSN) return;

    let active = true;
    void (async () => {
      const [Sentry, { Capacitor }] = await Promise.all([
        import("@sentry/browser"),
        import("@capacitor/core"),
      ]);
      if (!active) return;

      const info = Capacitor.isNativePlatform()
        ? await import("@capacitor/app").then(({ App }) => App.getInfo())
        : null;
      if (!active) return;

      Sentry.init({
        dsn: DSN,
        environment: process.env.NODE_ENV,
        release: info ? `${info.id}@${info.version}+${info.build}` : undefined,
        sendDefaultPii: false,
        tracesSampleRate: 0.1,
        beforeSend(event) {
          if (event.request) {
            delete event.request.cookies;
            delete event.request.headers;
          }
          return event;
        },
      });
    })();

    return () => {
      active = false;
    };
  }, []);
  return null;
}

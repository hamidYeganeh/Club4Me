"use client";

import { useEffect } from "react";
import * as Sentry from "@sentry/browser";
import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";

const DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;

export function Observability() {
  useEffect(() => {
    if (!DSN) return;
    void (async () => {
      const info = Capacitor.isNativePlatform() ? await App.getInfo() : null;
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
  }, []);
  return null;
}

"use client";

import { Button, Typography, toast } from "@heroui/react";
import { http } from "@api";
import { useEffect, useState } from "react";

import { accountAuthLoginSocialSectionStyles } from "./AccountAuthLoginSocialSection.styles";
import type { AccountAuthLoginSocialSectionProps } from "./AccountAuthLoginSocialSection.types";

export function AccountAuthLoginSocialSection({
  caption,
  xLabel,
  facebookLabel,
  googleLabel,
  unavailable,
}: AccountAuthLoginSocialSectionProps) {
  const styles = accountAuthLoginSocialSectionStyles();
  const [providers, setProviders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    void http.get<{ items: Array<{ id: string; enabled: boolean }> }>("/account/auth/social/providers")
      .then((data) => setProviders(Object.fromEntries(data.items.map((item) => [item.id, item.enabled]))))
      .catch(() => setProviders({}));
  }, []);

  const start = async (provider: "google" | "facebook" | "x") => {
    if (!providers[provider]) return toast.info(unavailable);
    try {
      const { url } = await http.post<{ url: string }>("/account/auth/social/start", { provider, returnTo: window.location.pathname + window.location.search });
      window.location.assign(url);
    } catch { toast.danger("شروع ورود اجتماعی انجام نشد"); }
  };

  return (
    <section className={styles.root()} aria-label={caption}>
      <div className={styles.divider()}>
        <span className={styles.rule()} />
        <Typography type="body-xs" weight="medium" color="muted" className={styles.caption()}>{caption}</Typography>
        <span className={styles.rule()} />
      </div>
      <div className={styles.list()}>
        <Button
          isIconOnly
          variant="secondary"
          aria-label={xLabel}
          className={styles.button()}
          isDisabled={!providers.x}
          onPress={() => void start("x")}
        >
          <XLogo />
        </Button>
        <Button
          isIconOnly
          variant="secondary"
          aria-label={facebookLabel}
          className={styles.button()}
          isDisabled={!providers.facebook}
          onPress={() => void start("facebook")}
        >
          <FacebookLogo />
        </Button>
        <Button
          isIconOnly
          variant="secondary"
          aria-label={googleLabel}
          className={styles.button()}
          isDisabled={!providers.google}
          onPress={() => void start("google")}
        >
          <GoogleLogo />
        </Button>
      </div>
    </section>
  );
}

function XLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden focusable="false">
      <path
        fill="currentColor"
        d="M18.244 2H21.5l-7.5 8.57L22.5 22h-6.59l-5.16-6.74L5.2 22H1.94l8.02-9.16L1.5 2h6.75l4.66 6.18L18.244 2Zm-1.16 18.06h1.8L7.01 3.84H5.08l12.004 16.22Z"
      />
    </svg>
  );
}

function FacebookLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden focusable="false">
      <path
        fill="#1877F2"
        d="M22 12.06C22 6.5 17.52 2 12 2S2 6.5 2 12.06c0 5.02 3.66 9.18 8.44 9.94v-7.03H8.08v-2.91h2.36V9.84c0-2.34 1.4-3.63 3.52-3.63.99 0 2.04.18 2.04.18v2.25h-1.15c-1.13 0-1.48.7-1.48 1.42v1.71h2.52l-.4 2.91h-2.12V22c4.78-.76 8.44-4.92 8.44-9.94Z"
      />
    </svg>
  );
}

function GoogleLogo() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden focusable="false">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09Z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23Z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53Z"
      />
    </svg>
  );
}

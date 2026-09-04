"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { tokenStore } from "@api";

import { getAppRouteRedirect, hasSeenWelcome } from "@/lib/welcome-onboarding";

type AppRouteGateProps = {
  children: ReactNode;
};

export function AppRouteGate({ children }: AppRouteGateProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const redirectTo = mounted
    ? getAppRouteRedirect(pathname, {
        welcomeSeen: hasSeenWelcome(),
        isAuthed: Boolean(tokenStore.get()),
      })
    : null;

  useEffect(() => {
    if (redirectTo) {
      router.replace(redirectTo);
    }
  }, [redirectTo, router]);

  if (!mounted || redirectTo) {
    return null;
  }

  return children;
}

"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { tokenStore } from "@api/http";

import { getAppRouteRedirect, hasSeenWelcome } from "@/lib/welcome-onboarding";
import {
  AuthScreenSkeleton,
  DashboardPageSkeleton,
  RouteLoadingSkeleton,
} from "@/components/loading-skeletons";

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
    if (pathname.startsWith("/auth") || pathname.startsWith("/welcome")) {
      return <AuthScreenSkeleton />;
    }
    if (pathname.startsWith("/athlete") || pathname.startsWith("/coach")) {
      return <DashboardPageSkeleton />;
    }
    return <RouteLoadingSkeleton />;
  }

  return children;
}

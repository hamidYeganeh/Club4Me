"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";

import { hasSeenWelcome } from "@/lib/welcome-onboarding";

type WelcomeOnboardingGateProps = {
  children: ReactNode;
};

export function WelcomeOnboardingGate({ children }: WelcomeOnboardingGateProps) {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (hasSeenWelcome()) {
      router.replace("/athlete");
      return;
    }

    setReady(true);
  }, [router]);

  if (!ready) {
    return null;
  }

  return children;
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { hasSeenWelcome } from "@/lib/welcome-onboarding";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace(hasSeenWelcome() ? "/athlete" : "/welcome");
  }, [router]);

  return null;
}

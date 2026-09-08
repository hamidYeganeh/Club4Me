"use client";
import { AppRecoveryScreen } from "@/components/app-recovery-screen";
export default function ErrorPage({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <AppRecoveryScreen onRetry={retry} />;
}

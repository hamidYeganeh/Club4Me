import { WelcomeOnboardingGate } from "@/components/welcome-onboarding-gate";

export default function WelcomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <WelcomeOnboardingGate>
      <div className="min-h-dvh bg-background text-foreground">{children}</div>
    </WelcomeOnboardingGate>
  );
}

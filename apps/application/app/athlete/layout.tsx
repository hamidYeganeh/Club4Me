import { AuthGate } from "@/components/auth-gate";

export default function AthleteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <AuthGate>
      <div className="flex min-h-dvh flex-1 flex-col pb-[calc(6.25rem+env(safe-area-inset-bottom))]">
        {children}
      </div>
    </AuthGate>
  );
}

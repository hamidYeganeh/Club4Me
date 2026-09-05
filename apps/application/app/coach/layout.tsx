import type { Metadata } from "next";

import { AuthGate } from "@/components/auth-gate";

export const metadata: Metadata = {
  title: "حساب مربی",
  robots: {
    index: false,
    follow: false,
  },
};

export default function CoachLayout({
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

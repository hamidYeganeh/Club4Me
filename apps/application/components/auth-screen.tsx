import type { ReactNode } from "react";

type AuthScreenProps = {
  children: ReactNode;
};

export function AuthScreen({ children }: AuthScreenProps) {
  return (
    <main className="flex min-h-full flex-1 flex-col items-center bg-background px-6 pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+var(--keyboard-inset,0px)))]">
      {children}
    </main>
  );
}

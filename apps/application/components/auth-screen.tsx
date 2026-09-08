import type { ReactNode } from "react";

type AuthScreenProps = {
  children: ReactNode;
};

export function AuthScreen({ children }: AuthScreenProps) {
  return (
    <main className="flex min-h-dvh flex-1 flex-col items-center overflow-x-hidden overflow-y-auto bg-background px-4 pb-[max(1.5rem,calc(env(safe-area-inset-bottom)+var(--keyboard-inset,0px)))]">
      <div className="flex w-full max-w-xl flex-col items-center [&>form]:rounded-3xl [&>form]:bg-surface [&>form]:p-5">
        {children}
      </div>
    </main>
  );
}

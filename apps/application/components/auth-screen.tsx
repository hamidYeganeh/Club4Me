import type { ReactNode } from "react";

type AuthScreenProps = {
  children: ReactNode;
};

export function AuthScreen({ children }: AuthScreenProps) {
  return (
    <main
      data-auth-screen
      className="flex min-h-dvh flex-1 flex-col items-center overflow-x-hidden overflow-y-auto bg-background px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex w-full max-w-xl flex-col items-center [&>form]:rounded-3xl [&>form]:bg-surface [&>form]:p-5">
        {children}
      </div>
    </main>
  );
}

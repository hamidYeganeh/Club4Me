import { Children, type ReactNode } from "react";

type AuthScreenProps = {
  children: ReactNode;
};

export function AuthScreen({ children }: AuthScreenProps) {
  const sections = Children.toArray(children);
  const header = sections[0];
  const content = sections.slice(1);

  return (
    <main
      data-auth-screen
      className="flex min-h-dvh flex-1 flex-col items-center overflow-x-hidden overflow-y-auto bg-background px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]"
    >
      <div className="flex w-full max-w-xl flex-col items-center">
        {header}
        <section
          className="mt-4 flex w-full flex-col items-center rounded-[2rem] bg-surface p-5 "
          data-auth-card
        >
          {content}
        </section>
      </div>
    </main>
  );
}

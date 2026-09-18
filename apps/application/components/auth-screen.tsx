import { Children, type CSSProperties, type ReactNode } from "react";
import Image from "next/image";

type AuthScreenProps = {
  children: ReactNode;
  /** Full-bleed background. Defaults to the Iran gym lifestyle photo. */
  imageSrc?: string;
  imageAlt?: string;
};

const AUTH_BLUR_LAYERS = [2, 4, 8, 16] as const;

export function AuthScreen({
  children,
  imageSrc = "/auth/iran-gym-man.png",
  imageAlt = "",
}: AuthScreenProps) {
  const sections = Children.toArray(children);
  const header = sections[0];
  const content = sections.slice(1);

  return (
    <main
      data-auth-screen
      className="relative isolate flex min-h-dvh flex-1 flex-col overflow-x-hidden overflow-y-auto bg-background"
    >
      <div className="pointer-events-none absolute inset-0 -z-20">
        <Image
          src={imageSrc}
          alt={imageAlt}
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-[78%] overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/55 to-transparent" />
        {AUTH_BLUR_LAYERS.map((blur, index) => (
          <div
            key={blur}
            className="pointer-events-none absolute inset-0 [backdrop-filter:blur(var(--blur))] [-webkit-backdrop-filter:blur(var(--blur))] [mask-image:linear-gradient(to_top,black,transparent_var(--reach))] [-webkit-mask-image:linear-gradient(to_top,black,transparent_var(--reach))] motion-reduce:[backdrop-filter:none] motion-reduce:[-webkit-backdrop-filter:none]"
            style={
              {
                "--blur": `${blur}px`,
                "--reach": `${100 - index * 20}%`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      <div className="relative z-10 flex min-h-dvh w-full flex-col">
        {header}
        <div className="mt-auto flex w-full justify-center px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8">
          <section
            className="flex w-full max-w-xl flex-col items-center rounded-[2rem] bg-surface p-5 shadow-[0_-12px_40px_rgba(0,0,0,0.12)]"
            data-auth-card
          >
            {content}
          </section>
        </div>
      </div>
    </main>
  );
}

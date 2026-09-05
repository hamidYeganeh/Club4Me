import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "خوش آمدید",
  robots: {
    index: false,
    follow: false,
  },
};

export default function WelcomeLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-dvh bg-background text-foreground">{children}</div>
  );
}

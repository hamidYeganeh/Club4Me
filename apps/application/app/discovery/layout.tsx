import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "کشف باشگاه‌ها و مربی‌ها",
  description:
    "باشگاه‌ها، مربی‌ها و کلاس‌های ورزشی نزدیکت را در Gym4Me پیدا و مقایسه کن.",
};

export default function DiscoveryLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}
